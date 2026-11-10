const boom = require('@hapi/boom');
const { Op, QueryTypes } = require('sequelize');
const db = require('../../models');

const MODULO_CONFIG = 'CoberturaStock';
const CONFIG_POR_DEFECTO = { porcentaje: 150, meses: 3 };
const CATEGORIA = 'Seguridad';

const entero = (v) => Math.max(1, Math.floor(Number(v) || 0));

// Fecha local YYYY-MM-DD (las fechas de movimientos son texto con ese formato).
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Cobertura de stock de los productos de Seguridad: promedio mensual de consumo, objetivo
// (porcentaje del promedio), faltante y cantidad sugerida a pedir redondeada por bulto.
class CoberturaService {
  async obtenerConfig() {
    const fila = await db.configuracion.findOne({ where: { modulo: MODULO_CONFIG } });
    let detalles = {};
    try {
      detalles = JSON.parse(fila?.detalles || '{}');
    } catch {
      detalles = {};
    }
    return {
      porcentaje: Number(detalles.porcentaje) > 0 ? Number(detalles.porcentaje) : CONFIG_POR_DEFECTO.porcentaje,
      meses: entero(detalles.meses || CONFIG_POR_DEFECTO.meses),
      observacion_pedido: typeof detalles.observacion_pedido === 'string' ? detalles.observacion_pedido : '',
    };
  }

  async guardarConfig({ porcentaje, meses, observacion_pedido: observacion }) {
    const actual = await this.obtenerConfig();
    const nuevo = {
      porcentaje: porcentaje !== undefined ? Number(porcentaje) : actual.porcentaje,
      meses: meses !== undefined ? entero(meses) : actual.meses,
      observacion_pedido: observacion !== undefined ? String(observacion || '').trim() : actual.observacion_pedido,
    };
    if (!(nuevo.porcentaje > 0)) throw boom.badRequest('El porcentaje debe ser mayor que 0');
    const detalles = JSON.stringify(nuevo);
    const fila = await db.configuracion.findOne({ where: { modulo: MODULO_CONFIG } });
    if (fila) await db.configuracion.update({ detalles }, { where: { modulo: MODULO_CONFIG } });
    else await db.configuracion.create({ modulo: MODULO_CONFIG, habilitado: false, detalles });
    return nuevo;
  }

  // Observacion predeterminada de los pedidos de un proveedor ('' la quita y se usa la general).
  async guardarObservacionProveedor(consecutivo, observacion) {
    const texto = String(observacion || '').trim() || null;
    const [filas] = await db.proveedores.update({ observacion_pedido: texto }, { where: { consecutivo } });
    if (!filas) {
      const existe = await db.proveedores.count({ where: { consecutivo } });
      if (!existe) throw boom.notFound('Proveedor no encontrado');
    }
    return { consecutivo, observacion_pedido: texto };
  }

  async guardarPorcentajeProducto(consecutivo, porcentaje) {
    const valor = porcentaje === null || porcentaje === '' || porcentaje === undefined ? null : Number(porcentaje);
    if (valor !== null && !(valor > 0)) throw boom.badRequest('El porcentaje debe ser mayor que 0 (o vacío para usar el general)');
    const [filas] = await db.productos.update({ cobertura_porcentaje: valor }, { where: { consecutivo } });
    if (!filas) {
      const existe = await db.productos.count({ where: { consecutivo } });
      if (!existe) throw boom.notFound('Producto no encontrado');
    }
    return { consecutivo, cobertura_porcentaje: valor };
  }

  // Crea (o actualiza, si llega `codigo`) el registro de un pedido a proveedor y devuelve su
  // codigo PP-00001. El codigo sale del id de la tabla, asi no se repite aunque dos usuarios
  // generen pedidos a la vez.
  async guardarPedido({ codigo, cons_proveedor: consProveedor, proveedor, usuario, observaciones, lineas, destinatarios, enviado, almacenes } = {}) {
    if (!consProveedor && !proveedor) throw boom.badRequest('Falta el proveedor del pedido');
    const detalle = JSON.stringify(Array.isArray(lineas) ? lineas : []);
    const campos = {
      cons_proveedor: consProveedor || null,
      proveedor: proveedor || null,
      usuario: usuario || null,
      observaciones: observaciones || null,
      detalle,
    };
    if (destinatarios !== undefined) campos.destinatarios = String(destinatarios || '').slice(0, 500) || null;
    if (enviado !== undefined) campos.enviado = Boolean(enviado);
    if (almacenes !== undefined) campos.almacenes = String(Array.isArray(almacenes) ? almacenes.join(',') : (almacenes || '')).slice(0, 200) || null;

    if (codigo) {
      const fila = await db.pedidos_proveedor.findOne({ where: { codigo } });
      if (!fila) throw boom.notFound('El pedido no existe');
      await fila.update(campos);
      return { codigo: fila.codigo, enviado: fila.enviado };
    }

    const fila = await db.pedidos_proveedor.create(campos);
    const nuevo = `PP-${String(fila.id).padStart(5, '0')}`;
    await fila.update({ codigo: nuevo });
    return { codigo: nuevo, enviado: false };
  }

  // Informe de pedidos a proveedor. estado: generado | enviado | recibido (vacio = todos).
  async listarPedidos({ desde, hasta, proveedor, estado, codigo } = {}) {
    const where = {};
    if (proveedor) where.cons_proveedor = proveedor;
    if (codigo) where.codigo = { [Op.like]: `%${codigo}%` };
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(`${desde}T00:00:00`);
      if (hasta) where.createdAt[Op.lte] = new Date(`${hasta}T23:59:59`);
    }
    if (estado === 'recibido') where.recibido = true;
    else if (estado === 'enviado') { where.enviado = true; where.recibido = false; }
    else if (estado === 'generado') { where.enviado = false; where.recibido = false; }

    const filas = await db.pedidos_proveedor.findAll({ where, order: [['id', 'DESC']], limit: 1000, raw: true });
    const usernames = [...new Set(filas.flatMap((f) => [f.usuario, f.recibido_por]).filter(Boolean))];
    const usuarios = usernames.length
      ? await db.usuarios.findAll({ where: { username: usernames }, attributes: ['username', 'nombre', 'apellido', 'email'], raw: true })
      : [];
    const porUsername = new Map(usuarios.map((u) => [u.username, u]));
    const nombre = (u) => (porUsername.get(u) ? [porUsername.get(u).nombre, porUsername.get(u).apellido].filter(Boolean).join(' ') : u || '');

    return filas.map((f) => {
      let detalle = [];
      try {
        detalle = JSON.parse(f.detalle || '[]');
      } catch {
        detalle = [];
      }
      return {
        id: f.id,
        codigo: f.codigo,
        fecha: ymd(f.createdAt),
        cons_proveedor: f.cons_proveedor,
        proveedor: f.proveedor,
        usuario: f.usuario,
        usuario_nombre: nombre(f.usuario),
        usuario_email: porUsername.get(f.usuario)?.email || '',
        observaciones: f.observaciones || '',
        almacenes: f.almacenes || '',
        destinatarios: f.destinatarios || '',
        enviado: Boolean(f.enviado),
        recibido: Boolean(f.recibido),
        fecha_recibido: f.fecha_recibido || null,
        recibido_por: f.recibido_por || null,
        recibido_por_nombre: nombre(f.recibido_por),
        estado: f.recibido ? 'recibido' : (f.enviado ? 'enviado' : 'generado'),
        detalle,
      };
    });
  }

  async marcarRecibido({ codigo, recibido = true, usuario }) {
    const fila = await db.pedidos_proveedor.findOne({ where: { codigo } });
    if (!fila) throw boom.notFound('El pedido no existe');
    const marcar = Boolean(recibido);
    await fila.update({
      recibido: marcar,
      fecha_recibido: marcar ? ymd(new Date()) : null,
      recibido_por: marcar ? (usuario || null) : null,
    });
    return { codigo, recibido: marcar, fecha_recibido: fila.fecha_recibido, recibido_por: fila.recibido_por };
  }

  // almacenes: arreglo de consecutivos (vacio = todos). proveedor: consecutivo (opcional).
  async coberturaProductos({ almacenes = [], proveedor = '' } = {}) {
    const config = await this.obtenerConfig();
    const hoy = new Date();
    const desdeFecha = new Date(hoy);
    desdeFecha.setMonth(desdeFecha.getMonth() - config.meses);
    const desde = ymd(desdeFecha);
    const hasta = ymd(hoy);

    const where = { };
    if (proveedor) where.cons_proveedor = proveedor;
    const productos = await db.productos.findAll({
      where,
      include: [{ model: db.categorias, as: 'categoria', where: { nombre: CATEGORIA }, attributes: [] }],
      raw: true,
    });
    const activos = productos.filter((p) => !p.isBlock);
    if (!activos.length) return { config, desde, hasta, productos: [] };

    const consecutivos = activos.map((p) => p.consecutivo);
    const filtroAlm = almacenes.length ? 'AND hm.cons_almacen_gestor IN (:almacenes)' : '';
    const filtroAlmStock = almacenes.length ? 'AND cons_almacen IN (:almacenes)' : '';
    const replacements = { consecutivos, almacenes, desde, hasta };

    // Consumo: salidas (sin traslados ni rechazados) dentro de la ventana de meses.
    const consumos = await db.sequelize.query(`
      SELECT hm.cons_producto AS cons_producto, SUM(hm.cantidad) AS total
      FROM historial_movimientos hm
      JOIN movimientos m ON m.consecutivo = hm.cons_movimiento
      WHERE hm.tipo_movimiento = 'Salida'
        AND hm.cons_lista_movimientos <> 'TR'
        AND COALESCE(hm.razon_movimiento, '') <> 'Rechazado'
        AND m.fecha >= :desde AND m.fecha <= :hasta
        AND hm.cons_producto IN (:consecutivos)
        ${filtroAlm}
      GROUP BY hm.cons_producto
    `, { replacements, type: QueryTypes.SELECT });
    const consumoPorProducto = new Map(consumos.map((c) => [c.cons_producto, Number(c.total) || 0]));

    const stocks = await db.sequelize.query(`
      SELECT cons_producto, SUM(cantidad) AS cantidad
      FROM stocks
      WHERE cons_producto IN (:consecutivos) ${filtroAlmStock}
      GROUP BY cons_producto
    `, { replacements, type: QueryTypes.SELECT });
    const stockPorProducto = new Map(stocks.map((s) => [s.cons_producto, Number(s.cantidad) || 0]));

    const proveedores = await db.proveedores.findAll({ attributes: ['consecutivo', 'razon_social', 'observacion_pedido'], raw: true });
    const nombreProveedor = new Map(proveedores.map((p) => [p.consecutivo, p.razon_social]));
    const obsProveedor = new Map(proveedores.map((p) => [p.consecutivo, p.observacion_pedido || '']));

    const redondear = (n) => Math.round(n * 100) / 100;
    const lista = activos.map((p) => {
      const stock = stockPorProducto.get(p.consecutivo) || 0;
      const total = consumoPorProducto.get(p.consecutivo) || 0;
      const promedio = total / config.meses;
      const propio = p.cobertura_porcentaje !== null && p.cobertura_porcentaje !== undefined && Number(p.cobertura_porcentaje) > 0;
      const porcentaje = propio ? Number(p.cobertura_porcentaje) : config.porcentaje;
      const objetivo = promedio * (porcentaje / 100);
      const faltante = Math.max(0, objetivo - stock);
      const bulto = Number(p.bulto) > 0 ? Number(p.bulto) : 1;
      // Productos marcados sin "pedido sugerido": se muestran, pero sin alerta ni pedido.
      const aplica = p.pedido_sugerido === null || p.pedido_sugerido === undefined ? true : Boolean(p.pedido_sugerido);
      return {
        consecutivo: p.consecutivo,
        name: p.name,
        nombre_proveedor: p.nombre_proveedor || null,
        cons_proveedor: p.cons_proveedor,
        proveedor: nombreProveedor.get(p.cons_proveedor) || null,
        observacion_proveedor: obsProveedor.get(p.cons_proveedor) || '',
        bulto,
        stock: redondear(stock),
        consumo_total: redondear(total),
        promedio_mensual: redondear(promedio),
        porcentaje,
        porcentaje_propio: propio ? Number(p.cobertura_porcentaje) : null,
        objetivo: redondear(objetivo),
        faltante: redondear(faltante),
        pedido_sugerido: aplica,
        alerta: aplica && promedio > 0 && stock < objetivo,
        sugerido: aplica && faltante > 0 ? Math.ceil(faltante / bulto - 1e-9) * bulto : 0,
      };
    }).sort((a, b) => Number(b.alerta) - Number(a.alerta) || a.name.localeCompare(b.name));

    return { config, desde, hasta, productos: lista };
  }
}

module.exports = CoberturaService;
