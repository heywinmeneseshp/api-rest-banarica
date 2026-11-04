const boom = require('@hapi/boom');
const { QueryTypes } = require('sequelize');
const db = require('../../models');

const sequelize = db.sequelize;

const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const select = (sql, replacements = {}, transaction) => sequelize.query(sql, { type: QueryTypes.SELECT, replacements, transaction });
const exec = (sql, replacements = {}, transaction) => sequelize.query(sql, { replacements, transaction });

// Fecha (Date o texto) -> 'YYYY-MM-DD'.
const ymd = (v) => {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const texto = (v) => {
  const t = typeof v === 'string' ? v.trim() : v;
  return t === '' || t === undefined ? null : t;
};

// Mes que "gana" en un rango de fechas (el mes con mas dias de la semana).
function calcMesDesdeRango(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return null;
  const inicio = new Date(`${ymd(fechaInicio)}T00:00:00`);
  const fin = new Date(`${ymd(fechaFin)}T00:00:00`);
  const cuenta = {};
  const cur = new Date(inicio);
  while (cur <= fin) {
    const key = `${cur.getFullYear()}-${cur.getMonth()}`;
    cuenta[key] = (cuenta[key] || 0) + 1;
    cur.setDate(cur.getDate() + 1);
  }
  let maxKey = null;
  let maxDias = 0;
  for (const [k, d] of Object.entries(cuenta)) {
    if (d > maxDias) { maxDias = d; maxKey = k; }
  }
  if (!maxKey) return null;
  const [anho, mes] = maxKey.split('-');
  return `${MESES_ES[parseInt(mes, 10)]} ${anho}`;
}

// Niveles a los que se asocia un costo, del mas especifico al mas general.
// El nivel se deduce de lo que tenga lleno el item (igual que en el formulario).
function nivelCalculado(it) {
  const lleno = (v) => v && v !== 'N/A';
  if (lleno(it.id_contenedor)) return 'contenedor';
  if (lleno(it.booking)) return 'booking';
  if (lleno(it.semana)) return 'semana';
  if (lleno(it.mes)) return 'mes';
  if (it.anho) return 'año';
  return null;
}

// "Año", "anho" o "anio" -> "año"; cualquier otro texto se devuelve en minusculas.
function normalizarNivel(valor) {
  const t = String(valor || '').trim().toLowerCase();
  return ['anho', 'anio'].includes(t) ? 'año' : t;
}

// TRM oficial (la certifica la Superfinanciera con datos del Banco de la Republica),
// publicada en datos abiertos de Colombia. Cada registro trae el rango de fechas en
// que esta vigente (un fin de semana o festivo queda cubierto por la del ultimo dia
// habil): se guarda en la fecha "vigenciadesde" y trmParaFecha() usa la mas reciente
// anterior a la fecha de cada factura.
const URL_TRM_BANREP = 'https://www.datos.gov.co/resource/32sa-8pi3.json';
const TRM_DESDE_POR_DEFECTO = '2024-01-01';

class CostosLogisticosService {
  // ───────────────────────── Catalogos simples ─────────────────────────
  async listarEstados() {
    return select('SELECT id, nombre, color, descripcion, updatedAt AS updated_at FROM costos_estados_factura ORDER BY nombre');
  }

  async guardarEstado(data) {
    const nombre = texto(data?.nombre);
    if (!nombre) throw boom.badRequest('nombre requerido');
    const color = data.color || '#6c757d';
    if (data.id) {
      await exec('UPDATE costos_estados_factura SET nombre=:nombre, color=:color, descripcion=:descripcion WHERE id=:id',
        { nombre, color, descripcion: texto(data.descripcion), id: data.id });
    } else {
      await exec('INSERT INTO costos_estados_factura (nombre, color, descripcion) VALUES (:nombre, :color, :descripcion)',
        { nombre, color, descripcion: texto(data.descripcion) });
    }
  }

  async eliminarEstado(id) {
    await exec('DELETE FROM costos_estados_factura WHERE id=:id', { id });
  }

  // ───────────────────────── Cobros a terceros ─────────────────────────
  async listarTerceros() {
    return select('SELECT id, tipo, nombre, nit, updatedAt AS updated_at FROM costos_terceros ORDER BY nombre');
  }

  async guardarTercero(data) {
    const nombre = texto(data?.nombre);
    if (!nombre) throw boom.badRequest('nombre requerido');
    const tipo = ['cliente', 'finca', 'proveedor', 'otro'].includes(data.tipo) ? data.tipo : 'otro';
    if (data.id) {
      await exec('UPDATE costos_terceros SET tipo=:tipo, nombre=:nombre, nit=:nit WHERE id=:id', { tipo, nombre, nit: texto(data.nit), id: data.id });
      return data.id;
    }
    const [id] = await sequelize.query('INSERT INTO costos_terceros (tipo, nombre, nit) VALUES (:tipo, :nombre, :nit)',
      { replacements: { tipo, nombre, nit: texto(data.nit) } });
    return id;
  }

  async eliminarTercero(id) {
    const [{ n }] = await select('SELECT COUNT(*) AS n FROM costos_cobros WHERE tercero_id=:id', { id });
    if (Number(n) > 0) throw boom.conflict(`No se puede eliminar: tiene ${n} cobro(s) registrado(s)`);
    await exec('DELETE FROM costos_terceros WHERE id=:id', { id });
  }

  async listarEstadosCobro() {
    return select('SELECT id, nombre, color, descripcion, updatedAt AS updated_at FROM costos_estados_cobro ORDER BY id');
  }

  async guardarEstadoCobro(data) {
    const nombre = texto(data?.nombre);
    if (!nombre) throw boom.badRequest('nombre requerido');
    const color = data.color || '#6c757d';
    if (data.id) {
      await exec('UPDATE costos_estados_cobro SET nombre=:nombre, color=:color, descripcion=:descripcion WHERE id=:id',
        { nombre, color, descripcion: texto(data.descripcion), id: data.id });
    } else {
      await exec('INSERT INTO costos_estados_cobro (nombre, color, descripcion) VALUES (:nombre, :color, :descripcion)',
        { nombre, color, descripcion: texto(data.descripcion) });
    }
  }

  async eliminarEstadoCobro(id) {
    await exec('DELETE FROM costos_estados_cobro WHERE id=:id', { id });
  }

  // Busca un tercero por nombre (sin importar mayusculas) y, si no existe, lo crea.
  async terceroPorNombre(nombre, transaction) {
    const n = texto(nombre);
    if (!n) return null;
    const filas = await select('SELECT id FROM costos_terceros WHERE LOWER(nombre)=LOWER(:n) LIMIT 1', { n }, transaction);
    if (filas[0]) return filas[0].id;
    const [id] = await sequelize.query("INSERT INTO costos_terceros (tipo, nombre) VALUES ('otro', :n)", { replacements: { n }, transaction });
    return id;
  }

  async listarTiposDocumento() {
    return select('SELECT id, nombre, sentido, descripcion, updatedAt AS updated_at FROM costos_tipos_documento ORDER BY nombre');
  }

  async guardarTipoDocumento(data) {
    const nombre = texto(data?.nombre);
    if (!nombre) throw boom.badRequest('nombre requerido');
    const sentido = data.sentido || 'resta';
    if (data.id) {
      await exec('UPDATE costos_tipos_documento SET nombre=:nombre, sentido=:sentido, descripcion=:descripcion WHERE id=:id',
        { nombre, sentido, descripcion: texto(data.descripcion), id: data.id });
    } else {
      await exec('INSERT INTO costos_tipos_documento (nombre, sentido, descripcion) VALUES (:nombre, :sentido, :descripcion)',
        { nombre, sentido, descripcion: texto(data.descripcion) });
    }
  }

  async eliminarTipoDocumento(id) {
    await exec('DELETE FROM costos_tipos_documento WHERE id=:id', { id });
  }

  async listarTiposCosto(q) {
    const cols = `id, codigo, nombre, descripcion, aplica_finca, aplica_puerto, aplica_inspeccion, aplica_todos, updatedAt AS updated_at`;
    if (q !== undefined && q !== null) {
      return select(`SELECT ${cols} FROM costos_tipos_costo WHERE nombre LIKE :t OR codigo LIKE :t ORDER BY nombre LIMIT 30`, { t: `%${q}%` });
    }
    return select(`SELECT ${cols} FROM costos_tipos_costo ORDER BY nombre`);
  }

  async guardarTipoCosto(data) {
    const codigo = texto(data?.codigo);
    const nombre = texto(data?.nombre);
    if (!codigo) throw boom.badRequest('codigo requerido');
    if (!nombre) throw boom.badRequest('nombre requerido');
    const valores = {
      codigo: codigo.toUpperCase(),
      nombre,
      descripcion: texto(data.descripcion),
      finca: data.aplica_finca ? 1 : 0,
      puerto: data.aplica_puerto ? 1 : 0,
      insp: data.aplica_inspeccion ? 1 : 0,
      todos: data.aplica_todos ? 1 : 0,
    };
    if (data.id) {
      await exec(`UPDATE costos_tipos_costo SET codigo=:codigo, nombre=:nombre, descripcion=:descripcion,
        aplica_finca=:finca, aplica_puerto=:puerto, aplica_inspeccion=:insp, aplica_todos=:todos WHERE id=:id`, { ...valores, id: data.id });
    } else {
      await exec(`INSERT INTO costos_tipos_costo (codigo, nombre, descripcion, aplica_finca, aplica_puerto, aplica_inspeccion, aplica_todos)
        VALUES (:codigo, :nombre, :descripcion, :finca, :puerto, :insp, :todos)`, valores);
    }
  }

  async eliminarTipoCosto(id) {
    await exec('DELETE FROM costos_tipos_costo WHERE id=:id', { id });
  }

  async listarItems(q = '') {
    const cols = 'id, codigo, nombre, descripcion, unidad, precio_ref, tipo_costo_default, updatedAt AS updated_at';
    const filas = q
      ? await select(`SELECT ${cols} FROM costos_items_catalog WHERE nombre LIKE :t OR codigo LIKE :t ORDER BY nombre LIMIT 30`, { t: `%${q}%` })
      : await select(`SELECT ${cols} FROM costos_items_catalog ORDER BY nombre`);
    return filas.map((f) => ({ ...f, precio_ref: num(f.precio_ref) }));
  }

  async guardarItem(data) {
    const nombre = texto(data?.nombre);
    if (!nombre) throw boom.badRequest('nombre requerido');
    const valores = {
      codigo: texto(data.codigo),
      nombre,
      descripcion: texto(data.descripcion),
      unidad: texto(data.unidad),
      precio: num(data.precio_ref),
      tipo: texto(data.tipo_costo_default),
    };
    if (data.id) {
      await exec(`UPDATE costos_items_catalog SET codigo=:codigo, nombre=:nombre, descripcion=:descripcion, unidad=:unidad,
        precio_ref=:precio, tipo_costo_default=:tipo WHERE id=:id`, { ...valores, id: data.id });
    } else {
      await exec(`INSERT INTO costos_items_catalog (codigo, nombre, descripcion, unidad, precio_ref, tipo_costo_default)
        VALUES (:codigo, :nombre, :descripcion, :unidad, :precio, :tipo)`, valores);
    }
  }

  async cargarItems(filas) {
    let inserted = 0;
    const errors = [];
    for (const fila of filas) {
      if (!texto(fila?.nombre)) { errors.push(`Fila sin Nombre: ${JSON.stringify(fila)}`); continue; }
      await this.guardarItem(fila);
      inserted += 1;
    }
    return { ok: true, inserted, errors };
  }

  async validarConceptos(nombres = []) {
    const desconocidos = [];
    for (const nombre of nombres) {
      const filas = await select('SELECT id FROM costos_items_catalog WHERE LOWER(nombre)=LOWER(:n) OR LOWER(codigo)=LOWER(:n) LIMIT 1', { n: String(nombre) });
      if (filas.length === 0) desconocidos.push(nombre);
    }
    return desconocidos;
  }

  async eliminarItem(id) {
    await exec('DELETE FROM costos_items_catalog WHERE id=:id', { id });
  }

  async listarProveedores() {
    return select('SELECT nit, nombre, razon_social, updatedAt AS updated_at FROM costos_proveedores ORDER BY nombre');
  }

  async guardarProveedor({ nit, nombre, razon_social: razonSocial }) {
    const nitLimpio = texto(String(nit ?? ''));
    if (!nitLimpio || !texto(nombre)) throw boom.badRequest('nit y nombre son requeridos');
    await exec(`INSERT INTO costos_proveedores (nit, nombre, razon_social) VALUES (:nit, :nombre, :razon)
      ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), razon_social=VALUES(razon_social)`,
    { nit: nitLimpio, nombre: texto(nombre), razon: texto(razonSocial) });
  }

  async cargarProveedores(filas) {
    let inserted = 0;
    const errors = [];
    for (const fila of filas) {
      if (!fila?.nit || !fila?.nombre) { errors.push(`Fila sin NIT o Nombre: ${JSON.stringify(fila)}`); continue; }
      await this.guardarProveedor(fila);
      inserted += 1;
    }
    return { ok: true, inserted, errors };
  }

  async validarNits(nits = []) {
    const desconocidos = [];
    for (const nit of nits) {
      const limpio = String(nit).trim();
      const filas = await select('SELECT nit FROM costos_proveedores WHERE nit=:nit LIMIT 1', { nit: limpio });
      if (filas.length === 0) desconocidos.push(limpio);
    }
    return desconocidos;
  }

  async eliminarProveedor(nit) {
    await exec('DELETE FROM costos_proveedores WHERE nit=:nit', { nit: String(nit) });
  }

  // ───────────────────────────── TRM ─────────────────────────────
  async listarTrm() {
    const filas = await select('SELECT fecha, valor FROM costos_trm ORDER BY fecha DESC');
    return filas.map((f) => ({ fecha: f.fecha, valor: num(f.valor) }));
  }

  // TRM exacta o la mas reciente anterior a la fecha.
  async trmParaFecha(fecha, transaction) {
    if (!fecha) return null;
    const filas = await select('SELECT valor FROM costos_trm WHERE fecha <= :fecha ORDER BY fecha DESC LIMIT 1', { fecha }, transaction);
    return filas[0] ? num(filas[0].valor) : null;
  }

  async cargarTrm(filas) {
    let total = 0;
    for (const { fecha, valor } of filas) {
      if (!fecha || valor == null || Number.isNaN(Number(valor))) continue;
      await exec(`INSERT INTO costos_trm (fecha, valor) VALUES (:fecha, :valor)
        ON DUPLICATE KEY UPDATE valor=VALUES(valor)`, { fecha: String(fecha).slice(0, 10), valor: Number(valor) });
      total += 1;
    }
    return total;
  }

  // Trae la TRM oficial desde `desde` (AAAA-MM-DD). Sin fecha: desde 7 dias antes de la
  // ultima TRM guardada (para corregir ajustes recientes) o, si no hay ninguna, desde 2024.
  async sincronizarTrmBanrep({ desde, hasta } = {}) {
    const fechaValida = (f) => typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f);
    if (hasta && !fechaValida(hasta)) throw boom.badRequest('La fecha final no es válida');
    if (desde && !fechaValida(desde)) throw boom.badRequest('La fecha inicial no es válida');
    if (desde && hasta && desde > hasta) throw boom.badRequest('La fecha inicial no puede ser mayor que la final');
    let inicio = desde || null;
    if (!inicio) {
      const [ultima] = await select('SELECT MAX(fecha) AS fecha FROM costos_trm');
      if (ultima?.fecha) {
        const d = new Date(`${ultima.fecha}T00:00:00`);
        d.setDate(d.getDate() - 7);
        inicio = ymd(d);
      } else {
        inicio = TRM_DESDE_POR_DEFECTO;
      }
    }

    const pagina = 1000;
    let offset = 0;
    let guardados = 0;
    let ultimaFecha = null;
    let ultimoValor = null;
    // Socrata: paginado por $limit/$offset, ordenado por fecha para que el offset sea estable.
    for (;;) {
      const params = new URLSearchParams({
        $select: 'valor,vigenciadesde',
        $where: `vigenciadesde >= '${inicio}T00:00:00'${hasta ? ` AND vigenciadesde <= '${hasta}T23:59:59'` : ''}`,
        $order: 'vigenciadesde ASC',
        $limit: String(pagina),
        $offset: String(offset),
      });
      let respuesta;
      try {
        respuesta = await fetch(`${URL_TRM_BANREP}?${params.toString()}`, { signal: AbortSignal.timeout(20000) });
      } catch (error) {
        throw boom.badGateway('No fue posible conectar con el servicio de datos abiertos de la TRM. Intente más tarde.');
      }
      if (!respuesta.ok) throw boom.badGateway(`El servicio de la TRM respondió ${respuesta.status}. Intente más tarde.`);
      const filas = await respuesta.json();
      if (!Array.isArray(filas) || filas.length === 0) break;

      const validas = filas
        .map((f) => ({ fecha: ymd(f.vigenciadesde), valor: Number(f.valor) }))
        .filter((f) => f.fecha && Number.isFinite(f.valor) && f.valor > 0);
      if (validas.length) {
        await exec(
          `INSERT INTO costos_trm (fecha, valor) VALUES ${validas.map((_, i) => `(:f${i}, :v${i})`).join(', ')}
           ON DUPLICATE KEY UPDATE valor=VALUES(valor)`,
          Object.fromEntries(validas.flatMap((f, i) => [[`f${i}`, f.fecha], [`v${i}`, f.valor]])),
        );
        guardados += validas.length;
        ultimaFecha = validas[validas.length - 1].fecha;
        ultimoValor = validas[validas.length - 1].valor;
      }
      if (filas.length < pagina) break;
      offset += pagina;
    }
    return { ok: true, desde: inicio, hasta: hasta || null, guardados, ultimaFecha, ultimoValor };
  }

  // Se llama al abrir el modulo de Facturas: sincroniza SOLO la primera vez de cada dia
  // (fecha de Colombia). Si la consulta falla no se marca el dia, asi el siguiente
  // ingreso lo vuelve a intentar.
  async sincronizarTrmDiaria() {
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const modulo = 'CostosTrmUltimaSync';
    const registro = await db.configuracion.findOne({ where: { modulo } });
    let ultima = null;
    try {
      ultima = JSON.parse(registro?.detalles || '{}').fecha || null;
    } catch {
      ultima = null;
    }
    if (ultima === hoy) return { ok: true, omitida: true, fecha: hoy };

    const resultado = await this.sincronizarTrmBanrep();
    const detalles = JSON.stringify({ fecha: hoy });
    if (registro) await db.configuracion.update({ detalles }, { where: { modulo } });
    else await db.configuracion.create({ modulo, habilitado: false, detalles });
    return { ...resultado, omitida: false, fecha: hoy };
  }

  async borrarTrm() {
    await exec('DELETE FROM costos_trm');
  }

  // ─────────────────────────── Facturas ───────────────────────────
  async calcularTotalConTrm(items, fecha, transaction) {
    let total = 0;
    let trm = null;
    for (const it of items || []) {
      const subtotal = (parseFloat(it.cantidad) || 0) * (parseFloat(it.valor_unitario) || 0);
      if (String(it.divisa || 'COP').toUpperCase() === 'USD') {
        if (trm === null) trm = (await this.trmParaFecha(fecha, transaction)) ?? 1;
        total += subtotal * trm;
      } else {
        total += subtotal;
      }
    }
    return total;
  }

  // Inserta los items y devuelve los ids nuevos (en el mismo orden). Cada item con tercero
  // genera un cobro: si el item ya tenia uno (it.id) y el tercero no cambio se conserva su
  // estado y fechas; si cambio de tercero o es nuevo, nace como "Pendiente por cobrar".
  async insertarItems(facturaId, items, transaction, cobrosPrevios = new Map()) {
    const ids = [];
    for (const it of items || []) {
      const [nuevoId] = await sequelize.query(`INSERT INTO costos_factura_items
        (factura_id, semana, mes, anho, concepto, id_contenedor, booking, divisa, cantidad, valor_unitario, nivel_asociacion, tipo_costo, metodo_distribucion)
        VALUES (:facturaId, :semana, :mes, :anho, :concepto, :contenedor, :booking, :divisa, :cantidad, :valorUnitario, :nivel, :tipoCosto, :metodo)`, { replacements: {
        facturaId,
        semana: texto(it.semana),
        mes: texto(it.mes),
        anho: texto(it.anho),
        concepto: texto(it.concepto),
        contenedor: texto(it.id_contenedor),
        booking: texto(it.booking),
        divisa: it.divisa || 'COP',
        cantidad: num(it.cantidad),
        valorUnitario: num(it.valor_unitario),
        nivel: texto(it.nivel_asociacion),
        tipoCosto: texto(it.tipo_costo),
        metodo: it.metodo_distribucion || 'por_cajas',
      }, transaction });
      ids.push(nuevoId);

      const terceroId = it.tercero_id ? Number(it.tercero_id) : await this.terceroPorNombre(it.tercero_nombre_nuevo, transaction);
      if (terceroId) {
        const previo = it.id ? cobrosPrevios.get(Number(it.id)) : null;
        const motivo = texto(it.cobro_motivo);
        if (previo && previo.tercero_id === terceroId) {
          await exec('UPDATE costos_cobros SET item_id=:nuevoId, motivo=:motivo WHERE id=:id', { nuevoId, motivo, id: previo.id }, transaction);
          cobrosPrevios.delete(Number(it.id));
        } else {
          await exec('INSERT INTO costos_cobros (item_id, tercero_id, motivo) VALUES (:nuevoId, :terceroId, :motivo)', { nuevoId, terceroId, motivo }, transaction);
        }
      }
    }
    return ids;
  }

  async validarDuplicada({ numero_factura: numero, nit_proveedor: nit, fecha }, excluirId = null) {
    if (!(texto(numero) && texto(nit) && fecha)) return;
    const anho = String(fecha).slice(0, 4);
    const filas = await select(
      `SELECT id FROM costos_facturas WHERE numero_factura=:numero AND nit_proveedor=:nit AND fecha LIKE :anho ${excluirId ? 'AND id <> :excluir' : ''} LIMIT 1`,
      { numero: numero.trim(), nit: nit.trim(), anho: `${anho}-%`, excluir: excluirId },
    );
    if (filas.length > 0) {
      throw boom.badRequest(`Ya existe la factura "${numero.trim()}" del proveedor ${nit.trim()} en ${anho}`);
    }
  }

  async listarFacturas(filtros = {}) {
    const { nit_proveedor: nit, tipo, estado, advertencia, numero_factura: numero, fecha_desde: desde, fecha_hasta: hasta, concepto, semana } = filtros;
    const donde = [];
    const params = {};
    if (nit) { donde.push('f.nit_proveedor = :nit'); params.nit = nit; }
    if (tipo) { donde.push('f.tipo = :tipo'); params.tipo = tipo; }
    if (numero) { donde.push('f.numero_factura LIKE :numero'); params.numero = `%${numero}%`; }
    if (desde) { donde.push('f.fecha >= :desde'); params.desde = desde; }
    if (hasta) { donde.push('f.fecha <= :hasta'); params.hasta = hasta; }
    if (concepto) { donde.push('EXISTS (SELECT 1 FROM costos_factura_items i WHERE i.factura_id = f.id AND i.concepto LIKE :concepto)'); params.concepto = `%${concepto}%`; }
    if (semana) { donde.push('EXISTS (SELECT 1 FROM costos_factura_items i WHERE i.factura_id = f.id AND i.semana = :semana)'); params.semana = semana; }
    if (estado === '__sin_estado__') donde.push("(f.estado IS NULL OR f.estado = '')");
    else if (estado) { donde.push('f.estado = :estado'); params.estado = estado; }
    if (advertencia === 'mismatch') donde.push("f.estado_total = 'mismatch'");

    const filas = await select(`
      SELECT f.id, f.fecha, f.tipo, f.numero_factura, f.nit_proveedor, f.total, f.estado_total, f.estado,
             f.createdAt AS created_at, f.updatedAt AS updated_at,
             p.nombre AS proveedor_nombre, p.razon_social AS proveedor_razon
      FROM costos_facturas f
      LEFT JOIN costos_proveedores p ON p.nit = f.nit_proveedor
      ${donde.length ? `WHERE ${donde.join(' AND ')}` : ''}
      ORDER BY f.fecha DESC, f.id DESC
    `, params);
    if (!filas.length) return filas;

    const items = await select(`
      SELECT i.id, i.factura_id, i.semana, i.mes, i.anho, i.concepto, i.id_contenedor, i.booking, i.divisa, i.cantidad, i.valor_unitario,
             i.nivel_asociacion, i.tipo_costo, i.metodo_distribucion, i.distribuido_en,
             c.tercero_id, t.nombre AS tercero_nombre, c.motivo AS cobro_motivo, c.estado AS cobro_estado
      FROM costos_factura_items i
      LEFT JOIN costos_cobros c ON c.item_id = i.id
      LEFT JOIN costos_terceros t ON t.id = c.tercero_id
      WHERE i.factura_id IN (:ids) ORDER BY i.factura_id, i.id
    `, { ids: filas.map((f) => f.id) });
    const clientes = await this.clientesDeItems(items);
    const porFactura = {};
    for (const it of items) {
      (porFactura[it.factura_id] = porFactura[it.factura_id] || []).push({
        ...it, cantidad: num(it.cantidad), valor_unitario: num(it.valor_unitario), ...clientes(it),
      });
    }
    return filas.map((f) => ({ ...f, total: num(f.total), items: porFactura[f.id] || [] }));
  }

  // Cliente de cada item segun la operacion: por contenedor (cliente de su embarque) o por booking.
  // Los items de semana, mes o año cubren varios clientes y quedan sin cliente (null).
  async clientesDeItems(items) {
    const conts = [...new Set(items.map((i) => i.id_contenedor).filter((c) => c && c !== 'N/A'))];
    const books = [...new Set(items.map((i) => i.booking).filter((b) => b && b !== 'N/A'))];
    const porCont = new Map();
    const porBook = new Map();
    const agregar = (m, k, cod, nombre) => {
      if (!k || !(cod || nombre)) return;
      if (!m.has(k)) m.set(k, new Map());
      m.get(k).set(cod || nombre, nombre || cod);
    };
    if (conts.length) {
      const filas = await select(`
        SELECT DISTINCT ct.contenedor AS k, c.cod, c.razon_social AS cliente
        FROM Contenedors ct
        JOIN Listados l ON l.id_contenedor = ct.id
        JOIN Embarques e ON e.id = l.id_embarque
        JOIN clientes c ON c.id = e.id_cliente
        WHERE ct.contenedor IN (:conts)`, { conts });
      filas.forEach((f) => agregar(porCont, f.k, f.cod, f.cliente));
    }
    if (books.length) {
      const filas = await select(`
        SELECT DISTINCT e.booking AS k, c.cod, c.razon_social AS cliente
        FROM Embarques e
        JOIN clientes c ON c.id = e.id_cliente
        WHERE e.booking IN (:books)`, { books });
      filas.forEach((f) => agregar(porBook, f.k, f.cod, f.cliente));
    }
    return (it) => {
      const a = it.id_contenedor && it.id_contenedor !== 'N/A' ? porCont.get(it.id_contenedor) : null;
      const b = !a && it.booking && it.booking !== 'N/A' ? porBook.get(it.booking) : null;
      const m = a || b;
      return m ? { cliente: [...m.keys()].join(', '), cliente_nombre: [...m.values()].join(', ') } : { cliente: null, cliente_nombre: null };
    };
  }

  totalYEstado(calculado, declarado) {
    const total = declarado ?? calculado;
    const estadoTotal = declarado == null ? null : (Math.abs(calculado - declarado) < 0.01 ? 'ok' : 'mismatch');
    return { total: total || null, estadoTotal };
  }

  async crearFactura(data) {
    await this.validarDuplicada(data);
    return sequelize.transaction(async (transaction) => {
      const calculado = await this.calcularTotalConTrm(data.items, data.fecha, transaction);
      const declarado = data.total != null && data.total !== '' ? parseFloat(data.total) : null;
      const { total, estadoTotal } = this.totalYEstado(calculado, declarado);
      const [id] = await sequelize.query(
        `INSERT INTO costos_facturas (fecha, tipo, numero_factura, nit_proveedor, total, estado_total)
         VALUES (:fecha, :tipo, :numero, :nit, :total, :estadoTotal)`,
        {
          replacements: {
            fecha: texto(data.fecha), tipo: texto(data.tipo), numero: texto(data.numero_factura),
            nit: texto(data.nit_proveedor), total, estadoTotal,
          },
          transaction,
        },
      );
      await this.insertarItems(id, data.items, transaction);
      return id;
    });
  }

  async actualizarFactura(id, data) {
    await this.validarDuplicada(data, id);
    await sequelize.transaction(async (transaction) => {
      const calculado = await this.calcularTotalConTrm(data.items, data.fecha, transaction);
      let declarado = data.total != null && data.total !== '' ? parseFloat(data.total) : null;
      if (declarado === null) {
        const actual = await select('SELECT total FROM costos_facturas WHERE id=:id', { id }, transaction);
        if (actual[0]?.total != null) declarado = parseFloat(actual[0].total);
      }
      const { total, estadoTotal } = this.totalYEstado(calculado, declarado);
      await exec(`UPDATE costos_facturas SET fecha=:fecha, tipo=:tipo, numero_factura=:numero, nit_proveedor=:nit,
        total=:total, estado_total=:estadoTotal, estado=:estado WHERE id=:id`, {
        fecha: texto(data.fecha), tipo: texto(data.tipo), numero: texto(data.numero_factura), nit: texto(data.nit_proveedor),
        total, estadoTotal, estado: texto(data.estado), id,
      }, transaction);
      // Los items se reemplazan; los cobros ya registrados se reasocian a los items nuevos
      // (por el id anterior) para no perder estado ni fechas.
      const previos = await select(`SELECT c.id, c.item_id, c.tercero_id FROM costos_cobros c
        JOIN costos_factura_items i ON i.id = c.item_id WHERE i.factura_id=:id`, { id }, transaction);
      const mapaPrevios = new Map(previos.map((c) => [Number(c.item_id), c]));
      await exec('UPDATE costos_cobros SET item_id = -id WHERE item_id IN (SELECT id FROM costos_factura_items WHERE factura_id=:id)', { id }, transaction);
      await exec('DELETE FROM costos_factura_items WHERE factura_id=:id', { id }, transaction);
      await this.insertarItems(id, data.items, transaction, mapaPrevios);
      // Cobros cuyo item ya no tiene tercero (o se quito el item): se eliminan.
      await exec('DELETE FROM costos_cobros WHERE item_id < 0', {}, transaction);
    });
  }

  async cambiarEstadoFactura(id, estado) {
    await exec('UPDATE costos_facturas SET estado=:estado WHERE id=:id', { estado: texto(estado), id });
  }

  async eliminarFactura(id) {
    await sequelize.transaction(async (transaction) => {
      await exec('DELETE FROM costos_cobros WHERE item_id IN (SELECT id FROM costos_factura_items WHERE factura_id=:id)', { id }, transaction);
      await exec('DELETE FROM costos_factura_items WHERE factura_id=:id', { id }, transaction);
      await exec('DELETE FROM costos_facturas WHERE id=:id', { id }, transaction);
    });
  }

  async eliminarTodasFacturas() {
    const [{ total }] = await select('SELECT COUNT(*) AS total FROM costos_facturas');
    await sequelize.transaction(async (transaction) => {
      await exec('DELETE FROM costos_cobros', {}, transaction);
      await exec('DELETE FROM costos_factura_items', {}, transaction);
      await exec('DELETE FROM costos_facturas', {}, transaction);
    });
    return Number(total);
  }

  // Carga masiva: cada fila es un item; filas con el mismo numero_factura se
  // agrupan en una sola factura (sin numero = una factura por fila).
  async cargarFacturas(filas) {
    if (!Array.isArray(filas) || !filas.length) throw boom.badRequest('Se esperaba un array de filas');
    const grupos = new Map();
    let auto = 0;
    for (const fila of filas) {
      const clave = fila.numero_factura?.trim() || `__auto_${auto++}`;
      if (!grupos.has(clave)) {
        grupos.set(clave, {
          fecha: fila.fecha?.trim() || null,
          tipo: fila.tipo?.trim() || 'Factura',
          numero_factura: fila.numero_factura?.trim() || null,
          nit_proveedor: fila.nit_proveedor?.trim() || null,
          declaredTotal: fila.total !== undefined && fila.total !== '' ? parseFloat(fila.total) : null,
          items: [],
        });
      }
      const tieneAlgo = fila.concepto?.trim() || fila.id_contenedor?.trim() || fila.semana?.trim()
        || (fila.cantidad !== '' && fila.cantidad != null) || (fila.valor_unitario !== '' && fila.valor_unitario != null);
      if (tieneAlgo) {
        grupos.get(clave).items.push({
          semana: fila.semana?.trim() || null,
          mes: fila.mes?.trim() || null,
          anho: fila.anho?.trim() || null,
          concepto: fila.concepto?.trim() || null,
          id_contenedor: fila.id_contenedor?.trim() || null,
          booking: fila.booking?.trim() || null,
          divisa: fila.divisa?.trim() || 'COP',
          cantidad: fila.cantidad != null && fila.cantidad !== '' ? Number(fila.cantidad) : null,
          valor_unitario: fila.valor_unitario != null && fila.valor_unitario !== '' ? Number(fila.valor_unitario) : null,
          nivel_asociacion: fila.nivel_asociacion?.trim() || null,
          tipo_costo: fila.tipo_costo?.trim() || null,
          tercero_nombre_nuevo: fila.tercero?.trim() || null,
          cobro_motivo: fila.motivo_cobro?.trim() || null,
        });
      }
    }

    // Mes calculado desde la semana (si no viene) y validacion del declarado.
    const semanasUsadas = new Set();
    for (const [, g] of grupos) for (const it of g.items) if (it.semana && !it.mes) semanasUsadas.add(it.semana);
    const mesWarnings = [];
    if (semanasUsadas.size > 0) {
      const infos = await select('SELECT consecutivo, fecha_inicio, fecha_fin FROM semanas WHERE consecutivo IN (:c)', { c: [...semanasUsadas] });
      const mapa = Object.fromEntries(infos.map((s) => [s.consecutivo, s]));
      for (const [clave, g] of grupos) {
        g.items.forEach((it, i) => {
          if (!it.semana) return;
          const s = mapa[it.semana];
          if (!s?.fecha_inicio || !s?.fecha_fin) return;
          const mesCalculado = calcMesDesdeRango(s.fecha_inicio, s.fecha_fin);
          if (it.mes) {
            if (mesCalculado && it.mes.trim().toLowerCase() !== mesCalculado.toLowerCase()) {
              mesWarnings.push(`Factura "${clave}" ítem ${i + 1}: semana ${it.semana} pertenece a "${mesCalculado}" pero se declaró "${it.mes}" — semana y mes guardados en blanco`);
              it.semana = null;
              it.mes = null;
            }
          } else {
            it.mes = mesCalculado;
          }
        });
      }
    }

    // Contenedor vs booking/semana: si no coinciden se dejan en blanco.
    const contWarnings = [];
    for (const [clave, g] of grupos) {
      const desajustes = await this.validarContenedores(g.items.map((it) => ({ contenedor: it.id_contenedor, booking: it.booking, semana: it.semana })));
      for (const idx of desajustes) {
        const it = g.items[idx];
        contWarnings.push(`Factura "${clave}" ítem ${idx + 1}: contenedor ${it.id_contenedor} no coincide con booking=${it.booking} semana=${it.semana} — guardados en blanco`);
        it.id_contenedor = null;
        it.booking = null;
        it.semana = null;
      }
    }

    // Si el archivo trae el contenedor pero no el booking (o la semana), se completan desde la operacion.
    for (const [, g] of grupos) await this.completarDesdeContenedor(g.items);

    // Nivel de asociacion: siempre se deduce de los datos del item. Si el archivo trae
    // uno distinto (o un texto que no es un nivel valido) se avisa y se usa el deducido.
    const nivelWarnings = [];
    for (const [clave, g] of grupos) {
      g.items.forEach((it, i) => {
        const deducido = nivelCalculado(it);
        const declarado = normalizarNivel(it.nivel_asociacion);
        if (declarado && declarado !== deducido) {
          nivelWarnings.push(`Factura "${clave}" ítem ${i + 1}: el nivel "${it.nivel_asociacion}" no corresponde a los datos del ítem (nivel real: ${deducido || 'ninguno'}) — se guardó "${deducido || 'sin nivel'}"`);
        }
        it.nivel_asociacion = deducido;
      });
    }

    let inserted = 0;
    const errors = [];
    for (const [clave, g] of grupos) {
      try {
        const { declaredTotal, ...resto } = g;
        await this.crearFactura({ ...resto, ...(declaredTotal !== null ? { total: declaredTotal } : {}) });
        inserted += 1;
      } catch (error) {
        errors.push(`Factura "${clave}": ${error.output?.payload?.message || error.message}`);
      }
    }
    return { ok: true, inserted, errors, contWarnings, mesWarnings, nivelWarnings };
  }

  // ─────────────── Consultas sobre datos de la operacion ───────────────
  async buscarSemanas(q = '') {
    const numero = (String(q).match(/(\d+)/) || [])[1] || q;
    const filas = await select(`
      SELECT consecutivo, semana, anho, fecha_inicio, fecha_fin FROM semanas
      ${numero ? 'WHERE consecutivo LIKE :t' : ''}
      ORDER BY anho DESC, CAST(semana AS UNSIGNED) DESC LIMIT 15
    `, { t: `%${numero}%` });
    return filas.map((f) => ({ ...f, fecha_inicio: ymd(f.fecha_inicio), fecha_fin: ymd(f.fecha_fin) }));
  }

  async listarAnhos(q) {
    const filas = await select('SELECT DISTINCT anho FROM semanas WHERE anho IS NOT NULL ORDER BY anho DESC');
    const anhos = filas.map((f) => f.anho).filter(Boolean);
    return q ? anhos.filter((a) => String(a).includes(q)) : anhos;
  }

  buscarMeses(q = '') {
    const hoy = new Date().getFullYear();
    const todos = [];
    for (const anho of [hoy - 1, hoy, hoy + 1]) {
      for (let i = 0; i < 12; i += 1) {
        todos.push({ id: `${anho}-${i + 1}`, anho: String(anho), mes_numero: i + 1, nombre: `${MESES_ES[i]} ${anho}` });
      }
    }
    const t = String(q).toLowerCase();
    const filtrados = t ? todos.filter((m) => m.nombre.toLowerCase().includes(t) || m.anho.includes(t)) : todos;
    return filtrados.reverse();
  }

  async buscarContenedores(q = '') {
    if (String(q).length < 2) return [];
    const filas = await select(`
      SELECT ct.contenedor,
             MAX(e.booking) AS booking,
             s.semana, s.anho, s.consecutivo AS consecutivo_semana,
             MAX(DATE(l.fecha)) AS fecha_llenado,
             MAX(a.nombre) AS lugar_llenado,
             insp.fecha_inspeccion
      FROM Contenedors ct
      JOIN Listados l ON l.id_contenedor = ct.id
      LEFT JOIN Embarques e ON l.id_embarque = e.id
      LEFT JOIN semanas s ON e.id_semana = s.id
      LEFT JOIN almacenes a ON l.id_lugar_de_llenado = a.id
      LEFT JOIN (
        SELECT sa.id_contenedor, MAX(sa.fecha_de_uso) AS fecha_inspeccion
        FROM serial_de_articulos sa
        INNER JOIN MotivoDeUsos m ON sa.id_motivo_de_uso = m.id
        WHERE m.consecutivo = 'INSP02'
        GROUP BY sa.id_contenedor
      ) insp ON insp.id_contenedor = ct.id
      WHERE ct.contenedor LIKE :t
      GROUP BY ct.contenedor, s.consecutivo, s.semana, s.anho, insp.fecha_inspeccion
      ORDER BY s.anho DESC, CAST(s.semana AS UNSIGNED) DESC
      LIMIT 30
    `, { t: `%${q}%` });
    return filas.map((f) => ({ ...f, fecha_llenado: ymd(f.fecha_llenado), fecha_inspeccion: ymd(f.fecha_inspeccion) }));
  }

  async buscarBookings(q = '') {
    if (String(q).length < 2) return [];
    return select(`
      SELECT DISTINCT e.booking, s.consecutivo AS consecutivo_semana, s.semana, s.anho
      FROM Embarques e
      LEFT JOIN semanas s ON e.id_semana = s.id
      WHERE e.booking LIKE :t
      ORDER BY s.anho DESC, CAST(s.semana AS UNSIGNED) DESC
      LIMIT 20
    `, { t: `%${q}%` });
  }

  // Costo acumulado por cliente. Cada ítem de factura se lleva a COP (USD x TRM de la fecha de la
  // factura; las notas crédito restan según el sentido del tipo de documento) y se reparte en
  // partes iguales entre los contenedores que cubre su nivel de asociación (contenedor, booking,
  // semana, mes o año); cada contenedor pertenece al cliente de su embarque.
  async costoPorCliente({ desde, hasta, semana, concepto } = {}) {
    const params = {};
    const donde = [];
    if (desde) { donde.push('f.fecha >= :desde'); params.desde = desde; }
    if (hasta) { donde.push('f.fecha <= :hasta'); params.hasta = hasta; }
    if (concepto) { donde.push('i.concepto LIKE :concepto'); params.concepto = `%${concepto}%`; }
    // Los items marcados para cobrar a un tercero no son costo de los clientes: viven en "Pendiente por cobrar".
    donde.push('NOT EXISTS (SELECT 1 FROM costos_cobros cb WHERE cb.item_id = i.id)');
    const items = await select(`
      SELECT i.id, i.semana, i.mes, i.anho, i.id_contenedor, i.booking, i.divisa, i.cantidad, i.valor_unitario,
             i.nivel_asociacion, f.fecha, COALESCE(t.sentido, 'resta') AS sentido
      FROM costos_factura_items i
      JOIN costos_facturas f ON f.id = i.factura_id
      LEFT JOIN costos_tipos_documento t ON t.nombre = f.tipo
      WHERE ${donde.join(' AND ')}
    `, params);

    const conts = await select(`
      SELECT DISTINCT ct.contenedor, e.booking, e.id_cliente, c.razon_social AS cliente,
             s.consecutivo AS semana, s.anho, s.fecha_inicio, s.fecha_fin
      FROM Listados l
      JOIN Contenedors ct ON ct.id = l.id_contenedor
      LEFT JOIN Embarques e ON e.id = l.id_embarque
      LEFT JOIN clientes c ON c.id = e.id_cliente
      LEFT JOIN semanas s ON s.id = e.id_semana
    `);
    const upper = (v) => String(v || '').trim().toUpperCase();
    for (const c of conts) c.mes = calcMesDesdeRango(c.fecha_inicio, c.fecha_fin);
    const porCont = new Map();
    const porBook = new Map();
    const porSem = new Map();
    const porMes = new Map();
    const porAnho = new Map();
    const push = (m, k, v) => { if (k) { if (!m.has(k)) m.set(k, []); m.get(k).push(v); } };
    for (const c of conts) {
      push(porCont, upper(c.contenedor), c);
      push(porBook, upper(c.booking), c);
      push(porSem, upper(c.semana), c);
      push(porMes, upper(c.mes), c);
      push(porAnho, String(c.anho || ''), c);
    }

    const semanaFiltro = upper(semana);
    const trms = new Map();
    const clientes = new Map();
    const nuevo = (nombre) => ({ cliente: nombre, total: 0, totalUsd: 0, contenedores: new Set(), niveles: {}, nivelesUsd: {} });
    const sinAsignar = nuevo('Sin asignar');
    let sinTrm = 0;
    const cliente = (c) => {
      const k = c.id_cliente || `sin-${c.cliente || ''}`;
      if (!clientes.has(k)) clientes.set(k, nuevo(c.cliente || 'Sin cliente'));
      return clientes.get(k);
    };
    const sumar = (reg, monto, montoUsd, nivel) => {
      reg.total += monto;
      reg.niveles[nivel] = (reg.niveles[nivel] || 0) + monto;
      reg.totalUsd += montoUsd;
      reg.nivelesUsd[nivel] = (reg.nivelesUsd[nivel] || 0) + montoUsd;
    };

    for (const it of items) {
      const base = (parseFloat(it.cantidad) || 0) * (parseFloat(it.valor_unitario) || 0);
      const f = ymd(it.fecha);
      if (!trms.has(f)) trms.set(f, await this.trmParaFecha(f));
      const trm = trms.get(f);
      let monto;
      let montoUsd;
      if (String(it.divisa || 'COP').toUpperCase() === 'USD') {
        monto = base * (trm ?? 1);
        montoUsd = base;
      } else {
        monto = base;
        montoUsd = trm ? base / trm : 0;
        if (!trm && base) sinTrm += 1;
      }
      if (it.sentido === 'resta') { monto = -monto; montoUsd = -montoUsd; }
      const nivel = it.nivel_asociacion || nivelCalculado(it) || 'sin nivel';
      let cubre = [];
      if (nivel === 'contenedor') cubre = porCont.get(upper(it.id_contenedor)) || [];
      else if (nivel === 'booking') cubre = porBook.get(upper(it.booking)) || [];
      else if (nivel === 'semana') cubre = porSem.get(upper(it.semana)) || [];
      else if (nivel === 'mes') cubre = porMes.get(upper(it.mes)) || [];
      else if (nivel === 'año') cubre = porAnho.get(String(it.anho || '')) || [];
      const unicos = [...new Map(cubre.map((c) => [upper(c.contenedor), c])).values()];
      if (!unicos.length) {
        if (!semanaFiltro || upper(it.semana) === semanaFiltro) sumar(sinAsignar, monto, montoUsd, nivel);
        continue;
      }
      // El costo se reparte entre todos los contenedores que cubre el ítem; si se filtra una
      // semana, solo se muestra la parte que le toca a los contenedores de esa semana.
      const parte = monto / unicos.length;
      const parteUsd = montoUsd / unicos.length;
      for (const c of unicos) {
        if (semanaFiltro && upper(c.semana) !== semanaFiltro) continue;
        const reg = cliente(c);
        sumar(reg, parte, parteUsd, nivel);
        reg.contenedores.add(upper(c.contenedor));
      }
    }

    const r2 = (n) => Math.round(n * 100) / 100;
    const fila = (r) => ({
      cliente: r.cliente, total: r2(r.total), totalUsd: r2(r.totalUsd), contenedores: r.contenedores.size, niveles: r.niveles, nivelesUsd: r.nivelesUsd,
    });
    const lista = [...clientes.values()].map(fila).sort((a, b) => b.total - a.total);
    if (sinAsignar.total !== 0 || sinAsignar.totalUsd !== 0) lista.push(fila(sinAsignar));
    return { filas: lista, itemsSinTrm: sinTrm };
  }

  // Seguimiento de cobros a terceros: cada fila es un item de factura marcado para cobrar.
  // El monto es el valor del item (cantidad x valor unitario), en COP y en USD segun la TRM de la factura.
  async listarPendientePorCobrar({ desde, hasta, tercero, estado, semana } = {}) {
    const donde = [];
    const params = {};
    if (desde) { donde.push('f.fecha >= :desde'); params.desde = desde; }
    if (hasta) { donde.push('f.fecha <= :hasta'); params.hasta = hasta; }
    if (tercero) { donde.push('c.tercero_id = :tercero'); params.tercero = Number(tercero); }
    if (estado) { donde.push('c.estado = :estado'); params.estado = estado; }
    if (semana) { donde.push('i.semana = :semana'); params.semana = semana; }
    const filas = await select(`
      SELECT c.id, c.item_id, c.tercero_id, t.nombre AS tercero, t.tipo AS tercero_tipo, c.motivo, c.estado,
             c.fecha_cobro, c.fecha_pago, i.concepto, i.semana, i.id_contenedor, i.booking, i.divisa, i.cantidad, i.valor_unitario,
             f.id AS factura_id, f.fecha, f.numero_factura, f.tipo, p.nombre AS proveedor
      FROM costos_cobros c
      JOIN costos_factura_items i ON i.id = c.item_id
      JOIN costos_facturas f ON f.id = i.factura_id
      LEFT JOIN costos_terceros t ON t.id = c.tercero_id
      LEFT JOIN costos_proveedores p ON p.nit = f.nit_proveedor
      ${donde.length ? `WHERE ${donde.join(' AND ')}` : ''}
      ORDER BY f.fecha DESC, c.id DESC
    `, params);
    const trms = new Map();
    let sinTrm = 0;
    const resultado = [];
    for (const r of filas) {
      const base = (parseFloat(r.cantidad) || 0) * (parseFloat(r.valor_unitario) || 0);
      const f = ymd(r.fecha);
      if (!trms.has(f)) trms.set(f, await this.trmParaFecha(f));
      const trm = trms.get(f);
      let cop;
      let usd;
      if (String(r.divisa || 'COP').toUpperCase() === 'USD') {
        cop = base * (trm ?? 1);
        usd = base;
      } else {
        cop = base;
        usd = trm ? base / trm : 0;
        if (!trm && base) sinTrm += 1;
      }
      resultado.push({
        ...r, cantidad: num(r.cantidad), valor_unitario: num(r.valor_unitario),
        monto_cop: Math.round(cop * 100) / 100, monto_usd: Math.round(usd * 100) / 100,
      });
    }
    return { filas: resultado, itemsSinTrm: sinTrm };
  }

  async actualizarCobro(id, data = {}) {
    const sets = [];
    const params = { id };
    for (const campo of ['estado', 'fecha_cobro', 'fecha_pago', 'motivo']) {
      if (data[campo] !== undefined) { sets.push(`${campo}=:${campo}`); params[campo] = texto(data[campo]); }
    }
    if (params.estado === null) throw boom.badRequest('estado requerido');
    if (!sets.length) return;
    await exec(`UPDATE costos_cobros SET ${sets.join(', ')} WHERE id=:id`, params);
  }

  async cambiarEstadoCobroMasivo(ids = [], estado) {
    const e = texto(estado);
    if (!e) throw boom.badRequest('estado requerido');
    const lista = (Array.isArray(ids) ? ids : []).map(Number).filter(Boolean);
    if (!lista.length) return 0;
    await exec('UPDATE costos_cobros SET estado=:e WHERE id IN (:lista)', { e, lista });
    return lista.length;
  }

  // De una lista de bookings devuelve los que NO tienen ningun contenedor asociado.
  async bookingsSinContenedor(bookings = []) {
    const unicos = [...new Set(bookings.map((b) => String(b || '').trim()).filter((b) => b && b !== 'N/A'))];
    if (!unicos.length) return [];
    const filas = await select(`
      SELECT DISTINCT e.booking
      FROM Embarques e
      JOIN Listados l ON l.id_embarque = e.id
      WHERE l.id_contenedor IS NOT NULL AND e.booking IN (:unicos)
    `, { unicos });
    const con = new Set(filas.map((f) => String(f.booking).trim().toUpperCase()));
    return unicos.filter((b) => !con.has(b.toUpperCase()));
  }

  // Para items con contenedor pero sin booking o sin semana, los completa con los datos del
  // contenedor en la operacion. Solo se completa cuando el dato es unico (sin ambiguedad).
  async completarDesdeContenedor(items = []) {
    const pendientes = items.filter((it) => it.id_contenedor && it.id_contenedor !== 'N/A' && (!it.booking || !it.semana));
    if (!pendientes.length) return 0;
    const contenedores = [...new Set(pendientes.map((it) => it.id_contenedor))];
    const filas = await select(`
      SELECT DISTINCT ct.contenedor, e.booking, s.consecutivo AS semana
      FROM Contenedors ct
      JOIN Listados l ON l.id_contenedor = ct.id
      JOIN Embarques e ON e.id = l.id_embarque
      LEFT JOIN semanas s ON s.id = e.id_semana
      WHERE ct.contenedor IN (:contenedores)
    `, { contenedores });
    const porCont = new Map();
    for (const f of filas) {
      if (!porCont.has(f.contenedor)) porCont.set(f.contenedor, []);
      porCont.get(f.contenedor).push(f);
    }
    let completados = 0;
    for (const it of pendientes) {
      let cands = porCont.get(it.id_contenedor) || [];
      if (it.semana) cands = cands.filter((c) => c.semana === it.semana);
      if (it.booking) cands = cands.filter((c) => c.booking === it.booking);
      const bookings = [...new Set(cands.map((c) => c.booking).filter(Boolean))];
      const semanas = [...new Set(cands.map((c) => c.semana).filter(Boolean))];
      if (!it.booking && bookings.length === 1) { it.booking = bookings[0]; completados += 1; }
      if (!it.semana && semanas.length === 1) { it.semana = semanas[0]; completados += 1; }
    }
    return completados;
  }

  // Corrige items ya guardados que tienen contenedor pero les falta el booking o la semana.
  async completarBookingsExistentes() {
    const filas = await select(`SELECT id, id_contenedor, booking, semana FROM costos_factura_items
      WHERE id_contenedor IS NOT NULL AND id_contenedor <> '' AND id_contenedor <> 'N/A'
        AND (booking IS NULL OR booking = '' OR semana IS NULL OR semana = '')`);
    const antes = filas.map((f) => ({ ...f }));
    await this.completarDesdeContenedor(filas);
    let actualizados = 0;
    for (let i = 0; i < filas.length; i += 1) {
      if (filas[i].booking !== antes[i].booking || filas[i].semana !== antes[i].semana) {
        await exec('UPDATE costos_factura_items SET booking=:booking, semana=:semana WHERE id=:id',
          { booking: filas[i].booking || null, semana: filas[i].semana || null, id: filas[i].id });
        actualizados += 1;
      }
    }
    return { revisados: filas.length, actualizados };
  }

  // Valida [{contenedor, booking, semana}] contra la operacion y devuelve los
  // indices que NO coinciden (contenedor desconocido = no se puede validar).
  async validarContenedores(items = []) {
    const desajustes = [];
    for (let i = 0; i < items.length; i += 1) {
      const { contenedor, booking, semana } = items[i];
      if (!contenedor || contenedor === 'N/A') continue;
      const filas = await select(`
        SELECT e.booking, s.consecutivo AS consecutivo_semana
        FROM Contenedors ct
        JOIN Listados l ON l.id_contenedor = ct.id
        LEFT JOIN Embarques e ON l.id_embarque = e.id
        LEFT JOIN semanas s ON e.id_semana = s.id
        WHERE ct.contenedor = :contenedor
      `, { contenedor });
      if (!filas.length) continue;
      if (booking && booking !== 'N/A' && !filas.some((f) => f.booking === booking)) { desajustes.push(i); continue; }
      if (semana) {
        const candidatas = booking ? filas.filter((f) => f.booking === booking) : filas;
        if (!candidatas.some((f) => f.consecutivo_semana === semana)) desajustes.push(i);
      }
    }
    return desajustes;
  }
}

module.exports = CostosLogisticosService;
