'use strict';

const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');
const env = require('../../config/env');

const MODULO_CONFIG = 'ProgramacionCorte';

// programacionCorte.fecha se guarda como STRING "YYYY-MM-DD" (fecha calendario
// pura, sin hora ni zona). El frontend ya la manda normalizada, pero se
// re-valida/normaliza aca tambien (por si llega un serial de Excel crudo u
// otro formato via API directa) para que SIEMPRE quede en ese formato: si
// quedara con hora/zona mezclada, el comparativo contra Listado (que si
// convierte a hora Bogota) dejaria de cuadrar aunque sea el mismo dia.
function normalizarFechaProgramacion(valor) {
  if (valor === null || valor === undefined || valor === '') return '';

  if (typeof valor === 'number' && valor > 20000) {
    // Serial de Excel: conteo de dias, sin zona horaria que aplicar.
    const d = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  const texto = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);

  const partes = texto.split(/[/.-]/);
  if (partes.length === 3 && partes.every((p) => /^\d+$/.test(p))) {
    const [a, b, c] = partes.map((p) => p.padStart(2, '0'));
    return partes[0].length === 4 ? `${a}-${b}-${c}` : `${c}-${b}-${a}`;
  }

  return texto;
}

// Compara texto ignorando mayusculas/tildes/espacios — se usa para calzar
// "finca" (Programacion de Corte) contra el nombre real del almacen
// (Listado) cuando el proceso de empaque no tiene un almacen mapeado en la
// configuracion.
const ACENTOS = { a: 'áàäâ', e: 'éèëê', i: 'íìïî', o: 'óòöô', u: 'úùüû', n: 'ñ' };
const MAPA_ACENTOS = new Map();
Object.entries(ACENTOS).forEach(([plano, variantes]) => {
  [...variantes].forEach((c) => MAPA_ACENTOS.set(c, plano));
});
function normalizarTexto(valor) {
  return [...String(valor || '').trim().toLowerCase()]
    .map((c) => MAPA_ACENTOS.get(c) || c)
    .join('')
    .replace(/\s+/g, ' ');
}

class ProgramacionCorteService {
  async obtenerConfigProcesos() {
    const [config] = await db.configuracion.findOrCreate({
      where: { modulo: MODULO_CONFIG },
      defaults: {
        habilitado: false,
        detalles: JSON.stringify({ procesos_almacenes: [] })
      }
    });

    let detalles = { procesos_almacenes: [] };
    try {
      detalles = typeof config.detalles === 'string'
        ? JSON.parse(config.detalles)
        : (config.detalles || {});
    } catch (error) {
      console.warn('Error al parsear config de ProgramacionCorte:', error);
    }

    return Array.isArray(detalles.procesos_almacenes) ? detalles.procesos_almacenes : [];
  }

  async cargar(filas = [], semanaConsecutivo = '') {
    if (!Array.isArray(filas) || filas.length === 0) {
      throw boom.badRequest('No se recibieron filas para cargar.');
    }

    const semanaTexto = String(semanaConsecutivo || '').trim();
    if (!semanaTexto) {
      throw boom.badRequest('Debe seleccionar la semana a cargar.');
    }

    const semana = await db.semanas.findOne({
      where: { consecutivo: semanaTexto }
    });

    if (!semana) {
      throw boom.badRequest(`La semana "${semanaTexto}" no existe.`);
    }

    const filasValidas = [];
    for (const fila of filas) {
      const fecha = normalizarFechaProgramacion(fila.fecha);
      const booking = String(fila.booking ?? '').trim();
      const transportadora = String(fila.transportadora ?? '').trim();
      const procesoEmpaque = String(fila.proceso_empaque ?? '').trim();
      const finca = String(fila.finca ?? '').trim();
      const cajas = Number(fila.cajas);
      const combo = String(fila.combo ?? '').trim();

      if (fecha && booking && transportadora && procesoEmpaque && finca && combo && Number.isFinite(cajas)) {
        filasValidas.push({ fecha, booking, transportadora, procesoEmpaque, finca, cajas, combo });
      }
    }

    const errores = [];
    const bookingsUnicos = [...new Set(filasValidas.map((f) => f.booking))];
    const fincasUnicas = [...new Set(filasValidas.map((f) => f.finca))];
    const transportadorasUnicas = [...new Set(filasValidas.map((f) => f.transportadora))];

    const embarques = await db.Embarque.findAll({
      where: {
        [Op.or]: [
          { bl: { [Op.in]: bookingsUnicos } },
          { booking: { [Op.in]: bookingsUnicos } }
        ]
      },
      include: [{ model: db.semanas, required: false }]
    });

    const embarquePorBooking = new Map();
    for (const e of embarques) {
      embarquePorBooking.set(String(e.bl || '').trim(), e);
      embarquePorBooking.set(String(e.booking || '').trim(), e);
    }

    const almacenes = await db.almacenes.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.in]: fincasUnicas } },
          { consecutivo: { [Op.in]: fincasUnicas } }
        ]
      }
    });

    const almacenPorNombre = new Map();
    for (const a of almacenes) {
      almacenPorNombre.set(String(a.nombre || '').trim(), a);
      almacenPorNombre.set(String(a.consecutivo || '').trim(), a);
    }

    const transportadorasCatalogo = transportadorasUnicas.length > 0
      ? await db.transportadoras.findAll({
        where: {
          [Op.or]: [
            { razon_social: { [Op.in]: transportadorasUnicas } },
            { consecutivo: { [Op.in]: transportadorasUnicas } },
          ],
        },
      })
      : [];
    const transportadoraPorNombre = new Map();
    for (const t of transportadorasCatalogo) {
      transportadoraPorNombre.set(String(t.razon_social || '').trim(), t);
      transportadoraPorNombre.set(String(t.consecutivo || '').trim(), t);
    }

    // Columna "combo" opcional (compatibilidad con Excels viejos que no la
    // traen) — el producto/fruta que se está cortando, referenciando el
    // catálogo de combos ya existente por código o nombre.
    const combosTexto = [...new Set(
      filasValidas.map((f) => String(f.combo ?? '').trim()).filter(Boolean),
    )];
    const combos = combosTexto.length > 0
      ? await db.combos.findAll({
        where: {
          [Op.or]: [
            { nombre: { [Op.in]: combosTexto } },
            { consecutivo: { [Op.in]: combosTexto } },
          ],
        },
      })
      : [];
    const comboPorNombre = new Map();
    for (const c of combos) {
      comboPorNombre.set(String(c.nombre || '').trim(), c);
      comboPorNombre.set(String(c.consecutivo || '').trim(), c);
    }

    const filasParaCrear = [];
    const erroresFila = new Map();
    let filaActual = 0;

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const numeroFila = i + 2;
      const fecha = normalizarFechaProgramacion(fila.fecha);
      const booking = String(fila.booking ?? '').trim();
      const transportadoraTexto = String(fila.transportadora ?? '').trim();
      const procesoEmpaque = String(fila.proceso_empaque ?? '').trim();
      const finca = String(fila.finca ?? '').trim();
      const cajas = Number(fila.cajas);
      const comboTexto = String(fila.combo ?? '').trim();

      if (!fecha || !booking || !transportadoraTexto || !procesoEmpaque || !finca || !comboTexto || !Number.isFinite(cajas)) {
        errores.push({
          fila: numeroFila,
          message: 'Campos incompletos o invalidos (Fecha, Booking, Transportadora, Proceso de Empaque, Finca, Producto, Cajas).'
        });
        continue;
      }

      const embarque = embarquePorBooking.get(booking);

      if (!embarque) {
        errores.push({
          fila: numeroFila,
          booking,
          message: `No se encontro un embarque con booking/BL "${booking}".`
        });
        continue;
      }

      if (Number(embarque.id_semana) !== Number(semana.id)) {
        errores.push({
          fila: numeroFila,
          booking,
          message: `El embarque "${booking}" pertenece a la semana "${embarque.semana?.consecutivo || 'Sin semana'}", no a la semana seleccionada "${semana.consecutivo}".`
        });
        continue;
      }

      const almacen = almacenPorNombre.get(finca);

      if (!almacen) {
        errores.push({
          fila: numeroFila,
          finca,
          message: `No se encontro una finca/almacen "${finca}".`
        });
        continue;
      }

      const combo = comboPorNombre.get(comboTexto);
      if (!combo) {
        errores.push({
          fila: numeroFila,
          combo: comboTexto,
          message: `No se encontro un producto/combo "${comboTexto}".`
        });
        continue;
      }

      const transportadora = transportadoraPorNombre.get(transportadoraTexto);
      if (!transportadora) {
        errores.push({
          fila: numeroFila,
          transportadora: transportadoraTexto,
          message: `No se encontro una transportadora "${transportadoraTexto}".`
        });
        continue;
      }

      filasParaCrear.push({
        fecha,
        booking,
        transportadora: transportadoraTexto,
        proceso_empaque: procesoEmpaque,
        finca,
        cajas,
        id_embarque: embarque.id,
        id_almacen: almacen.id,
        id_combo: combo.id,
        id_transportadora: transportadora.id
      });
      filaActual++;
    }

    if (errores.length > 0) {
      return {
        creados: 0,
        borrados: 0,
        abortado: true,
        message: 'No se cargo ni se borro nada: hay filas con errores.',
        errores
      };
    }

    const embarquesSemana = await db.Embarque.findAll({
      where: { id_semana: semana.id },
      attributes: ['id']
    });
    const idsEmbarquesSemana = embarquesSemana.map((e) => e.id);

    const borrados = idsEmbarquesSemana.length > 0
      ? await db.programacionCorte.destroy({
        where: { id_embarque: { [Op.in]: idsEmbarquesSemana } }
      })
      : 0;

    const creados = await db.programacionCorte.bulkCreate(filasParaCrear);

    // Best-effort: avisa a Corbana que ya cargamos esta semana, para que la
    // traiga sola (evita que alguien tenga que apretar "Sincronizar" allá a
    // mano). Nunca debe hacer fallar el cargue de acá — por eso no se
    // espera (`await`) y cualquier error solo se loguea.
    this.avisarCorbana(semana.consecutivo).catch((error) => {
      console.error('No se pudo avisar a Corbana del cargue de Programacion de Corte:', error.message);
    });

    return {
      creados: creados.length,
      borrados,
      abortado: false,
      message: `Se borraron ${borrados} registros de la semana "${semana.consecutivo}" y se cargaron ${creados.length} nuevos.`,
      errores: []
    };
  }

  async avisarCorbana(semanaConsecutivo) {
    if (!env.corbanaApiUrl || !env.corbanaApiKey) return;

    const response = await fetch(`${env.corbanaApiUrl.replace(/\/$/, '')}/api/v1/programacion-corte/webhook-sync-banarica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', api: env.corbanaApiKey },
      body: JSON.stringify({ semana: semanaConsecutivo }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async listar() {
    return db.programacionCorte.findAll({
      order: [['id', 'DESC']],
      include: [
        {
          model: db.Embarque,
          required: false,
          as: 'Embarque',
          include: [{ model: db.semanas, required: false }]
        },
        { model: db.almacenes, required: false, as: 'almacen' },
        { model: db.combos, required: false, as: 'combo' }
      ]
    });
  }

  async comparativa(semanaConsecutivo = '') {
    const semanaTexto = String(semanaConsecutivo || '').trim();
    if (!semanaTexto) {
      throw boom.badRequest('Debe seleccionar la semana.');
    }

    const semana = await db.semanas.findOne({
      where: { consecutivo: semanaTexto }
    });

    if (!semana) {
      throw boom.badRequest(`La semana "${semanaTexto}" no existe.`);
    }

    const embarquesSemana = await db.Embarque.findAll({
      where: { id_semana: semana.id },
      attributes: ['id']
    });
    const ids = embarquesSemana.map((e) => e.id);

    const progRows = ids.length > 0
      ? await db.programacionCorte.findAll({
        where: { id_embarque: { [Op.in]: ids } },
        include: [{ model: db.combos, required: false, as: 'combo' }]
      })
      : [];

    const listRows = ids.length > 0
      ? await db.Listado.findAll({
        where: {
          id_embarque: { [Op.in]: ids },
          habilitado: { [Op.ne]: false }
        },
        include: [
          { model: db.Embarque, required: false },
          { model: db.almacenes, required: false, as: 'almacen' },
          { model: db.combos, required: false }
        ]
      })
      : [];

    const procesosConfig = await this.obtenerConfigProcesos();
    const procesoAAlmacen = new Map(
      procesosConfig
        .filter((p) => p && p.proceso && p.almacen)
        .map((p) => [String(p.proceso).trim().toLowerCase(), String(p.almacen).trim()])
    );

    // La clave de comparación ahora incluye el producto (combo) — antes
    // agrupaba solo por fecha+booking+finca y el producto quedaba como un
    // desglose informativo aparte, lo que podía "coincidir" en cajas totales
    // aunque los productos programados y despachados fueran distintos.
    // programacionCorte.fecha es STRING (texto tal cual se cargo, "YYYY-MM-DD").
    // Listado.fecha es DATE (Sequelize la devuelve como objeto Date), pero
    // guardada como fecha calendario pura (ver comentario donde se lee mas
    // abajo) — se extrae su fecha en UTC directamente, sin conversion de
    // zona horaria, para que ambos lados queden en el mismo "YYYY-MM-DD".
    // Cuando un proceso_empaque no tiene almacen mapeado en la configuracion,
    // se compara el texto crudo de "finca" (Programacion de Corte) contra el
    // nombre del almacen (Listado). Sin normalizar, diferencias de
    // mayusculas/tildes/espacios ("Finca La Union" vs "finca la union ")
    // hacian que nunca calzaran aunque fueran el mismo lugar.
    // labelsPorKey guarda el texto original (sin normalizar) para mostrarlo
    // en la tabla, priorizando el de Programacion de Corte.
    const labelsPorKey = new Map();

    // procesosPorKey junta los proceso_empaque (puede haber mas de uno si
    // varios procesos distintos mapean al mismo almacen) que componen cada
    // fila de la comparativa, solo para mostrarlos en la columna.
    const procesosPorKey = new Map();

    const progMap = new Map();
    for (const r of progRows) {
      const procesoKey = String(r.proceso_empaque || '').trim().toLowerCase();
      const fincaComparacion = procesoAAlmacen.get(procesoKey) || String(r.finca).trim();
      const producto = String(r.combo?.nombre || 'Sin producto').trim();
      const fecha = String(r.fecha || '').trim().slice(0, 10);
      const booking = String(r.booking).trim();
      const key = `${fecha}|${normalizarTexto(booking)}|${normalizarTexto(fincaComparacion)}|${normalizarTexto(producto)}`;
      progMap.set(key, (progMap.get(key) || 0) + Number(r.cajas || 0));
      if (!labelsPorKey.has(key)) {
        labelsPorKey.set(key, { fecha, booking, finca: fincaComparacion, producto });
      }
      const procesoTexto = String(r.proceso_empaque || '').trim();
      if (procesoTexto) {
        if (!procesosPorKey.has(key)) procesosPorKey.set(key, new Set());
        procesosPorKey.get(key).add(procesoTexto);
      }
    }

    const listMap = new Map();
    for (const r of listRows) {
      // Listado.fecha se guarda como fecha calendario pura (medianoche, sin
      // hora real de un evento — ver listado.service.js `fecha: data.fecha`),
      // no como un timestamp de un instante real. toColombiaDate() le resta 5
      // horas asumiendo lo segundo, lo que corre la fecha un dia hacia atras
      // y rompe el emparejamiento contra programacionCorte.fecha (string
      // "YYYY-MM-DD" tal cual). Por eso se lee directo en UTC (asi fue
      // guardada), sin conversion de zona horaria.
      const fecha = r.fecha instanceof Date
        ? r.fecha.toISOString().slice(0, 10)
        : String(r.fecha || '').slice(0, 10);
      const bl = String(r.Embarque?.bl || '').trim();
      const finca = String(r.almacen?.nombre || '').trim();
      const producto = String(r.combo?.nombre || 'Sin producto').trim();
      const key = `${fecha}|${normalizarTexto(bl)}|${normalizarTexto(finca)}|${normalizarTexto(producto)}`;
      const cajas = Number(r.cajas_unidades || 0);
      listMap.set(key, (listMap.get(key) || 0) + cajas);
      if (!labelsPorKey.has(key)) {
        labelsPorKey.set(key, { fecha, booking: bl, finca, producto });
      }
    }

    const todas = new Set([...progMap.keys(), ...listMap.keys()]);
    const filas = [];
    for (const key of todas) {
      const { fecha, booking, finca, producto } = labelsPorKey.get(key) || {};
      const cajasProgramacion = progMap.get(key) || 0;
      const cajasListado = listMap.get(key) || 0;
      const procesoEmpaque = [...(procesosPorKey.get(key) || [])].join(', ');

      let estado;
      if (cajasProgramacion > 0 && cajasListado === 0) estado = 'solo_programacion';
      else if (cajasProgramacion === 0 && cajasListado > 0) estado = 'solo_listado';
      else estado = cajasProgramacion === cajasListado ? 'coincide' : 'difiere';

      filas.push({
        fecha,
        booking,
        procesoEmpaque,
        finca,
        producto,
        cajasProgramacion,
        cajasListado,
        diferencia: cajasProgramacion - cajasListado,
        estado
      });
    }

    filas.sort(
      (a, b) => String(a.fecha).localeCompare(String(b.fecha))
        || String(a.booking).localeCompare(String(b.booking))
        || String(a.finca).localeCompare(String(b.finca))
        || String(a.producto).localeCompare(String(b.producto))
    );

    return {
      semana: semana.consecutivo,
      totalProgramacion: [...progMap.values()].reduce((acc, v) => acc + v, 0),
      totalListado: [...listMap.values()].reduce((acc, v) => acc + v, 0),
      filas
    };
  }

  // Lineas reales de Listado que se relacionan con una fila puntual de
  // Programacion de Corte (misma fecha+booking+almacen+producto), usando la
  // MISMA resolucion de finca->almacen (config de procesos) que ya usa la
  // comparativa — para que "las lineas relacionadas" sean consistentes con
  // lo que la comparativa marca como coincide/difiere.
  async lineasListadoRelacionadas(id) {
    const fila = await db.programacionCorte.findByPk(id, {
      include: [
        { model: db.Embarque, required: false, as: 'Embarque' },
        { model: db.combos, required: false, as: 'combo' },
      ],
    });
    if (!fila) {
      throw boom.notFound('La fila de programacion no existe.');
    }

    const procesosConfig = await this.obtenerConfigProcesos();
    const procesoAAlmacen = new Map(
      procesosConfig
        .filter((p) => p && p.proceso && p.almacen)
        .map((p) => [normalizarTexto(p.proceso), String(p.almacen).trim()])
    );
    const procesoKey = normalizarTexto(fila.proceso_empaque);
    const fincaTexto = procesoAAlmacen.get(procesoKey) || String(fila.finca || '').trim();

    const almacenes = await db.almacenes.findAll();
    const almacen = almacenes.find((a) => normalizarTexto(a.nombre) === normalizarTexto(fincaTexto)) || null;

    const fecha = String(fila.fecha || '').trim().slice(0, 10);
    // Listado.fecha se guarda como fecha calendario en UTC (medianoche, sin
    // hora real de evento). Comparar contra un string "YYYY-MM-DD" hace que
    // Sequelize interprete la fecha en la zona horaria local del servidor y
    // el filtro nunca calza (mismo tipo de bug ya resuelto en comparativa) —
    // por eso se usa un rango explicito en UTC para ese dia completo.
    const inicioUtc = new Date(`${fecha}T00:00:00Z`);
    const finUtc = new Date(`${fecha}T23:59:59Z`);
    const where = {
      id_embarque: fila.id_embarque,
      fecha: { [Op.between]: [inicioUtc, finUtc] },
      habilitado: { [Op.ne]: false },
    };
    if (almacen) where.id_lugar_de_llenado = almacen.id;
    if (fila.id_combo) where.id_producto = fila.id_combo;

    const listado = await db.Listado.findAll({
      where,
      include: [
        { model: db.Contenedor, required: false },
        { model: db.almacenes, required: false, as: 'almacen' },
        { model: db.combos, required: false },
      ],
      order: [['id', 'ASC']],
    });

    return {
      fecha,
      booking: fila.booking,
      finca: fincaTexto,
      almacenEncontrado: Boolean(almacen),
      producto: fila.combo?.nombre || 'Sin producto',
      lineas: listado.map((row) => ({
        id: row.id,
        contenedor: row.Contenedor?.contenedor || '',
        almacen: row.almacen?.nombre || '',
        producto: row.combo?.nombre || '',
        cajas_unidades: row.cajas_unidades,
      })),
    };
  }

  async eliminar(id) {
    const item = await db.programacionCorte.findByPk(id);
    if (!item) {
      throw boom.notFound('El registro de programacion no existe');
    }
    await item.destroy();
    return { message: 'Registro de programacion eliminado', id };
  }
}

module.exports = ProgramacionCorteService;