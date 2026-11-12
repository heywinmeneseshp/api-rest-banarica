const { Op } = require('sequelize');
const db = require('../../models');
const env = require('../../config/env');
const ProgramacionCorteService = require('./programacionCorte.service');

// Conciliacion automatica con Corbana: los domingos y los martes en la noche (hora de Colombia) se le
// pide a Corbana que vuelva a traer la Programacion de Corte de las semanas recientes y proximas. Banarica
// es la fuente de verdad: si algo quedo distinto (por un aviso que fallo, un cambio hecho directo en
// Corbana, etc.), Corbana vuelve a quedar igual que Banarica.
const MARCADOR = 'CorbanaSyncNocturna';
const DIAS_EJECUCION = [0, 2]; // 0 = domingo, 2 = martes
const HORA_EJECUCION = 23; // 11:00 p.m. (hora de Colombia)
const DIAS_ATRAS = 35;
const DIAS_ADELANTE = 70;
const REVISION_MS = 30 * 60 * 1000; // cada 30 minutos revisa si toca correr

const ZONA = 'America/Bogota';
const fechaColombia = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: ZONA });
const horaColombia = (d = new Date()) => Number(d.toLocaleString('en-US', { timeZone: ZONA, hour: 'numeric', hour12: false })) % 24;
const diaSemanaDe = (yyyyMmDd) => new Date(`${yyyyMmDd}T12:00:00Z`).getUTCDay();

// Ultima ejecucion programada que ya paso (domingo o martes a las 11 p.m., hora de Colombia), como
// 'AAAA-MM-DD' de ese dia. Asi, si el servidor estuvo apagado a esa hora, se pone al dia al volver.
function ultimaEjecucionProgramada(ahora = new Date()) {
  const hoy = fechaColombia(ahora);
  for (let atras = 0; atras <= 7; atras += 1) {
    const dia = sumarDias(hoy, -atras);
    if (!DIAS_EJECUCION.includes(diaSemanaDe(dia))) continue;
    if (atras > 0 || horaColombia(ahora) >= HORA_EJECUCION) return dia;
  }
  return null;
}
const sumarDias = (yyyyMmDd, dias) => {
  const d = new Date(`${yyyyMmDd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

const servicio = new ProgramacionCorteService();

// Pide a Corbana sincronizar cada semana de la ventana [hoy-35 dias, hoy+70 dias]. Devuelve un resumen.
async function sincronizarSemanasRecientes() {
  if (!env.corbanaApiUrl || !env.corbanaApiKey) {
    return { omitida: true, motivo: 'Corbana no esta configurado (falta CORBANA_API_URL o CORBANA_API_KEY).' };
  }

  const hoy = fechaColombia();
  const desde = sumarDias(hoy, -DIAS_ATRAS);
  const hasta = sumarDias(hoy, DIAS_ADELANTE);
  const semanas = await db.semanas.findAll({
    where: { fecha_fin: { [Op.gte]: desde }, fecha_inicio: { [Op.lte]: hasta } },
    order: [['fecha_inicio', 'ASC']],
    attributes: ['consecutivo'],
    raw: true,
  });

  const resultados = [];
  for (const { consecutivo } of semanas) {
    try {
      const r = await servicio.avisarCorbana(consecutivo);
      resultados.push({ semana: consecutivo, ok: true, ...(r || {}) });
    } catch (error) {
      // Corbana responde 404 cuando esa semana todavia no existe alli: no es un error de sincronizacion.
      const inexistente = /no encontrada/i.test(error.message);
      resultados.push({ semana: consecutivo, ok: false, inexistente, message: error.message });
    }
  }

  return {
    omitida: false,
    desde,
    hasta,
    semanas: semanas.length,
    sincronizadas: resultados.filter((r) => r.ok).length,
    noExistenEnCorbana: resultados.filter((r) => r.inexistente).length,
    conError: resultados.filter((r) => !r.ok && !r.inexistente).length,
    resultados,
  };
}

async function leerMarcador() {
  const fila = await db.configuracion.findOne({ where: { modulo: MARCADOR } });
  try {
    return JSON.parse(fila?.detalles || '{}');
  } catch {
    return {};
  }
}

async function guardarMarcador(datos) {
  const detalles = JSON.stringify(datos);
  const fila = await db.configuracion.findOne({ where: { modulo: MARCADOR } });
  if (fila) await db.configuracion.update({ detalles }, { where: { modulo: MARCADOR } });
  else await db.configuracion.create({ modulo: MARCADOR, habilitado: false, detalles });
}

let corriendo = false;

// Corre la conciliacion si ya paso la ejecucion programada mas reciente (domingo o martes en la
// noche) y todavia no se hizo con exito.
async function revisar({ forzar = false } = {}) {
  if (corriendo) return null;
  const hoy = fechaColombia();
  const ranura = ultimaEjecucionProgramada();
  if (!forzar) {
    if (!ranura) return null;
    const marcador = await leerMarcador();
    // Hecha si ya se corrio para esa ranura, o si hubo una corrida posterior a ella (marcador antiguo).
    if (marcador.ranura === ranura || (marcador.fecha && marcador.fecha >= ranura)) return null;
  }

  corriendo = true;
  try {
    const resumen = await sincronizarSemanasRecientes();
    if (resumen.omitida) return resumen;
    const huboExito = resumen.semanas === 0 || resumen.sincronizadas > 0 || resumen.noExistenEnCorbana === resumen.semanas;
    console.log(`[Corbana] Conciliacion: ${resumen.sincronizadas}/${resumen.semanas} semanas sincronizadas, ${resumen.noExistenEnCorbana} sin semana en Corbana, ${resumen.conError} con error.`);
    resumen.resultados.filter((r) => !r.ok && !r.inexistente).forEach((r) => console.error(`[Corbana] Semana ${r.semana}: ${r.message}`));
    // Solo se marca el dia como hecho si Corbana respondio; si estaba caido se reintenta en la siguiente revision.
    if (huboExito) await guardarMarcador({ fecha: hoy, ranura, sincronizadas: resumen.sincronizadas, semanas: resumen.semanas, conError: resumen.conError });
    return resumen;
  } catch (error) {
    console.error('[Corbana] Error en la conciliacion nocturna:', error.message);
    return null;
  } finally {
    corriendo = false;
  }
}

function iniciar() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!env.corbanaApiUrl || !env.corbanaApiKey) return;
  const tick = () => revisar().catch((e) => console.error('[Corbana] Error al revisar la conciliacion:', e.message));
  setTimeout(tick, 2 * 60 * 1000).unref();
  setInterval(tick, REVISION_MS).unref();
  console.log('[Corbana] Conciliacion programada: domingos y martes a las 11:00 p.m. (hora de Colombia).');
}

module.exports = { iniciar, revisar, sincronizarSemanasRecientes, ultimaEjecucionProgramada };
