
const boom = require('@hapi/boom');
const { Op } = require("sequelize");
const db = require('../models');
const StockService = require('./stock.service');
const HistorialMovimientosService = require('./historialMovimientos.service');
const { listarFotosDeCarpeta } = require('./googleDrive/cargueFotos');

const stockService = new StockService();
const historialService = new HistorialMovimientosService();

class TrasladosService {

  constructor() {
  }

  async create(data, transaction = null) {
    // MAX(id) con lock en vez de COUNT(*): evita que dos traslados creados
    // al mismo tiempo lean el mismo total y generen el mismo consecutivo
    // (consecutivo es la primary key de esta tabla, asi que antes esto
    // terminaba en un error de clave duplicada para uno de los dos).
    const ownTransaction = !transaction;
    const t = transaction || await db.sequelize.transaction();
    try {
      const maxResult = await db.traslados.findOne({
        attributes: [[db.sequelize.fn('MAX', db.sequelize.col('id')), 'maxId']],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const nextNum = (Number(maxResult?.dataValues?.maxId) || 0) + 1;
      const consecutivo = "TR-" + nextNum;
      const itemNuevo = { consecutivo, ...data };
      const res = await db.traslados.create(itemNuevo, { transaction: t });
      if (ownTransaction) await t.commit();
      return res;
    } catch (error) {
      if (ownTransaction) await t.rollback();
      throw error;
    }
  }

  async executeTransfer(data) {
    const { origen, destino, semana, fecha, items, observaciones } = data;

    if (origen === destino) {
      throw boom.badRequest('El origen y el destino no pueden ser el mismo.');
    }

    const uniqueItems = new Map();
    for (const item of items) {
      const itemIdentifier = item.serial || item.bag_pack || item.s_pack || item.m_pack || item.l_pack;
      if (!itemIdentifier) {
        throw boom.badRequest(`El item ${item.cons_producto} no tiene un identificador valido para trasladar.`);
      }
      if (item.cons_almacen && item.cons_almacen !== origen) {
        throw boom.badRequest(`El item ${itemIdentifier} no pertenece al almacen origen ${origen}.`);
      }
      const uniqueKey = `${item.cons_producto}-${item.serial || item.bag_pack || item.s_pack || item.m_pack || item.l_pack}`;
      if (uniqueItems.has(uniqueKey)) {
        throw boom.conflict(`El item ${uniqueKey} esta repetido en la solicitud.`);
      }
      uniqueItems.set(uniqueKey, item);
    }

    const t = await db.sequelize.transaction();
    try {
      const itemsWithId = items.filter((item) => item.id);
      const itemsWithoutId = items.filter((item) => !item.id);
      const identifierFilters = itemsWithoutId.map((item) => {
        const identifiers = [
          item.serial ? { serial: item.serial } : null,
          item.bag_pack ? { bag_pack: item.bag_pack } : null,
          item.s_pack ? { s_pack: item.s_pack } : null,
          item.m_pack ? { m_pack: item.m_pack } : null,
          item.l_pack ? { l_pack: item.l_pack } : null,
        ].filter(Boolean);

        return {
          cons_producto: item.cons_producto,
          [Op.or]: identifiers,
        };
      });
      const seriales = await db.serial_de_articulos.findAll({
        where: {
          cons_almacen: origen,
          available: true,
          [Op.or]: [
            ...(itemsWithId.length > 0 ? [{ id: { [Op.in]: itemsWithId.map((item) => item.id) } }] : []),
            ...(identifierFilters.length > 0 ? identifierFilters : []),
          ],
        },
        transaction: t,
      });

      if (seriales.length !== items.length) {
        throw boom.badRequest('Algunos seriales ya no estan disponibles en el almacen origen.');
      }

      const traslado = await this.create({
        transportadora: "No aplica",
        conductor: "No aplica",
        vehiculo: "No aplica",
        origen,
        destino,
        estado: "Completado",
        fecha_salida: fecha,
        fecha_entrada: fecha,
        observaciones: observaciones || `Precintos transferidos al almacen ${destino}`,
        semana,
      }, t);

      if (items.length > 0) {
        await db.serial_de_articulos.update(
          { cons_almacen: destino },
          {
            where: {
              cons_almacen: origen,
              [Op.or]: [
                ...(itemsWithId.length > 0 ? [{ id: { [Op.in]: itemsWithId.map((item) => item.id) } }] : []),
                ...(identifierFilters.length > 0 ? identifierFilters : []),
              ],
            },
            transaction: t,
          }
        );
      }

      const cantidadesPorProducto = items.reduce((acc, item) => {
        acc[item.cons_producto] = (acc[item.cons_producto] || 0) + 1;
        return acc;
      }, {});

      for (const [cons_producto, cantidad] of Object.entries(cantidadesPorProducto)) {
        await stockService.subtractAmounts(origen, cons_producto, { cantidad }, t);
        await stockService.addAmounts(destino, cons_producto, { cantidad }, t);
        await historialService.create({
          cons_movimiento: traslado.consecutivo,
          cons_producto,
          cons_almacen_gestor: origen,
          cons_almacen_receptor: destino,
          cons_lista_movimientos: "TR",
          tipo_movimiento: "Traslado",
          cantidad,
        }, t);
      }

      await db.notificaciones.create({
        consecutivo: `NT-${Date.now() - 1662564279341}`,
        almacen_emisor: origen,
        almacen_receptor: destino,
        cons_movimiento: traslado.consecutivo,
        tipo_movimiento: "Traslado",
        descripcion: "Precintos transferidos.",
        aprobado: true,
        visto: false
      }, { transaction: t });

      await t.commit();
      return {
        bool: true,
        message: 'Transferencia realizada',
        data: traslado,
        itemsActualizados: items.length
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async _usuarioTienePermisoAlmacen(usuario, almacenConsecutivo) {
    if (!usuario?.username || !almacenConsecutivo) return false;

    const permiso = await db.almacenes_por_usuario.findOne({
      where: {
        username: usuario.username,
        id_almacen: almacenConsecutivo,
        habilitado: true,
      },
    });

    return Boolean(permiso);
  }

  async crearPendiente(data) {
    const { origen, destino, semana, fecha, items, observaciones, realizado_por } = data;

    if (origen === destino) {
      throw boom.badRequest('El origen y el destino no pueden ser el mismo.');
    }

    const uniqueItems = new Map();
    for (const item of items) {
      const itemIdentifier = item.serial || item.bag_pack || item.s_pack || item.m_pack || item.l_pack;
      if (!itemIdentifier) {
        throw boom.badRequest(`El item ${item.cons_producto} no tiene un identificador valido para trasladar.`);
      }
      if (item.cons_almacen && item.cons_almacen !== origen) {
        throw boom.badRequest(`El item ${itemIdentifier} no pertenece al almacen origen ${origen}.`);
      }
      const uniqueKey = `${item.cons_producto}-${itemIdentifier}`;
      if (uniqueItems.has(uniqueKey)) {
        throw boom.conflict(`El item ${uniqueKey} esta repetido en la solicitud.`);
      }
      uniqueItems.set(uniqueKey, item);
    }

    const t = await db.sequelize.transaction();
    try {
      const itemsWithId = items.filter((item) => item.id);
      const itemsWithoutId = items.filter((item) => !item.id);
      const identifierFilters = itemsWithoutId.map((item) => {
        const identifiers = [
          item.serial ? { serial: item.serial } : null,
          item.bag_pack ? { bag_pack: item.bag_pack } : null,
          item.s_pack ? { s_pack: item.s_pack } : null,
          item.m_pack ? { m_pack: item.m_pack } : null,
          item.l_pack ? { l_pack: item.l_pack } : null,
        ].filter(Boolean);

        return {
          cons_producto: item.cons_producto,
          [Op.or]: identifiers,
        };
      });

      const seriales = await db.serial_de_articulos.findAll({
        where: {
          cons_almacen: origen,
          available: true,
          [Op.or]: [
            ...(itemsWithId.length > 0 ? [{ id: { [Op.in]: itemsWithId.map((item) => item.id) } }] : []),
            ...(identifierFilters.length > 0 ? identifierFilters : []),
          ],
        },
        transaction: t,
      });

      if (seriales.length !== items.length) {
        throw boom.badRequest('Algunos seriales ya no estan disponibles en el almacen origen.');
      }

      const traslado = await this.create({
        transportadora: "No aplica",
        conductor: "No aplica",
        vehiculo: "No aplica",
        origen,
        destino,
        estado: "Pendiente",
        fecha_salida: fecha,
        fecha_entrada: null,
        observaciones: observaciones || `Precintos transferidos al almacen ${destino}`,
        semana,
      }, t);

      // Reservar los seriales: se marcan como no disponibles y se etiquetan con el
      // consecutivo del traslado, pero NO cambian de almacen hasta que se acepte.
      await db.serial_de_articulos.update(
        { available: false, cons_movimiento: traslado.consecutivo },
        {
          where: {
            id: { [Op.in]: seriales.map((s) => s.id) },
          },
          transaction: t,
        }
      );

      await db.notificaciones.create({
        consecutivo: `NT-${Date.now() - 1662564279341}`,
        almacen_emisor: origen,
        almacen_receptor: destino,
        cons_movimiento: traslado.consecutivo,
        tipo_movimiento: "Traslado",
        descripcion: `Transferencia pendiente por aceptar de ${realizado_por || 'un usuario'}.`,
        aprobado: false,
        visto: false
      }, { transaction: t });

      await t.commit();
      return {
        bool: true,
        message: 'Transferencia registrada como pendiente. El almacen destino debe aceptarla.',
        data: traslado,
        itemsReservados: seriales.length
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async aceptarTraslado(id, usuario) {
    const traslado = await db.traslados.findByPk(id);
    if (!traslado) {
      throw boom.notFound('El traslado no existe');
    }
    if (traslado.estado !== 'Pendiente') {
      throw boom.badRequest(`El traslado ya fue procesado (estado actual: ${traslado.estado}).`);
    }

    const tienePermiso = await this._usuarioTienePermisoAlmacen(usuario, traslado.destino);
    if (!tienePermiso) {
      throw boom.forbidden('No tienes permiso sobre el almacen destino de este traslado.');
    }

    const t = await db.sequelize.transaction();
    try {
      const seriales = await db.serial_de_articulos.findAll({
        where: { cons_movimiento: traslado.consecutivo, cons_almacen: traslado.origen },
        transaction: t,
      });

      if (seriales.length === 0) {
        throw boom.badRequest('No se encontraron los articulos reservados para este traslado.');
      }

      await db.serial_de_articulos.update(
        { cons_almacen: traslado.destino, available: true },
        {
          where: { id: { [Op.in]: seriales.map((s) => s.id) } },
          transaction: t,
        }
      );

      const cantidadesPorProducto = seriales.reduce((acc, item) => {
        acc[item.cons_producto] = (acc[item.cons_producto] || 0) + 1;
        return acc;
      }, {});

      for (const [cons_producto, cantidad] of Object.entries(cantidadesPorProducto)) {
        await stockService.subtractAmounts(traslado.origen, cons_producto, { cantidad }, t);
        await stockService.addAmounts(traslado.destino, cons_producto, { cantidad }, t);
        await historialService.create({
          cons_movimiento: traslado.consecutivo,
          cons_producto,
          cons_almacen_gestor: traslado.origen,
          cons_almacen_receptor: traslado.destino,
          cons_lista_movimientos: "TR",
          tipo_movimiento: "Traslado",
          cantidad,
        }, t);
      }

      await db.traslados.update(
        { estado: 'Completado', fecha_entrada: new Date().toISOString().slice(0, 10) },
        { where: { id }, transaction: t }
      );

      await db.notificaciones.update(
        { aprobado: true, visto: true },
        { where: { cons_movimiento: traslado.consecutivo }, transaction: t }
      );

      await t.commit();
      return { bool: true, message: 'Transferencia aceptada y completada.', itemsActualizados: seriales.length };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async rechazarTraslado(id, usuario, motivo) {
    const traslado = await db.traslados.findByPk(id);
    if (!traslado) {
      throw boom.notFound('El traslado no existe');
    }
    if (traslado.estado !== 'Pendiente') {
      throw boom.badRequest(`El traslado ya fue procesado (estado actual: ${traslado.estado}).`);
    }

    const tienePermiso = await this._usuarioTienePermisoAlmacen(usuario, traslado.destino);
    if (!tienePermiso) {
      throw boom.forbidden('No tienes permiso sobre el almacen destino de este traslado.');
    }

    const t = await db.sequelize.transaction();
    try {
      await db.serial_de_articulos.update(
        { available: true, cons_movimiento: null },
        {
          where: { cons_movimiento: traslado.consecutivo, cons_almacen: traslado.origen },
          transaction: t,
        }
      );

      await db.traslados.update(
        {
          estado: 'Rechazado',
          observaciones: motivo ? `${traslado.observaciones || ''} | Rechazado: ${motivo}`.trim() : traslado.observaciones,
        },
        { where: { id }, transaction: t }
      );

      await db.notificaciones.update(
        { aprobado: false, visto: true },
        { where: { cons_movimiento: traslado.consecutivo }, transaction: t }
      );

      await t.commit();
      return { bool: true, message: 'Transferencia rechazada. Los articulos vuelven a estar disponibles en el almacen origen.' };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async listarPendientesPorAlmacenes(almacenes = [], tipo = 'recibir') {
    if (!Array.isArray(almacenes) || almacenes.length === 0) return [];

    const whereAlmacen = tipo === 'enviados'
      ? { origen: { [Op.in]: almacenes } }
      : { destino: { [Op.in]: almacenes } };

    const traslados = await db.traslados.findAll({
      where: { estado: 'Pendiente', ...whereAlmacen },
      order: [['createdAt', 'DESC']],
    });

    const conteos = await Promise.all(
      traslados.map((traslado) => this.contarSerialesPorTraslado(traslado.consecutivo))
    );

    return traslados.map((traslado, index) => ({
      ...traslado.toJSON(),
      total_items: conteos[index],
    }));
  }

  async contarSerialesPorTraslado(consecutivo) {
    return db.serial_de_articulos.count({ where: { cons_movimiento: consecutivo } });
  }

  async contarPendientes(almacenes = []) {
    if (!Array.isArray(almacenes) || almacenes.length === 0) return 0;
    return db.traslados.count({ where: { estado: 'Pendiente', destino: { [Op.in]: almacenes } } });
  }

  async listarEvidenciasTraslado(id, usuario) {
    const traslado = await db.traslados.findByPk(id);
    if (!traslado) {
      throw boom.notFound('El traslado no existe');
    }

    const [tienePermisoOrigen, tienePermisoDestino] = await Promise.all([
      this._usuarioTienePermisoAlmacen(usuario, traslado.origen),
      this._usuarioTienePermisoAlmacen(usuario, traslado.destino),
    ]);

    if (!tienePermisoOrigen && !tienePermisoDestino) {
      throw boom.forbidden('No tienes permiso para ver la evidencia de este traslado.');
    }

    if (!traslado.evidencia_carpeta_id) {
      return { fotos: [], carpetaUrl: traslado.evidencia_carpeta_url || null };
    }

    const fotos = await listarFotosDeCarpeta(traslado.evidencia_carpeta_id);
    return { fotos, carpetaUrl: traslado.evidencia_carpeta_url || null };
  }

  async listarArticulosTraslado(id, usuario) {
    const traslado = await db.traslados.findByPk(id);
    if (!traslado) {
      throw boom.notFound('El traslado no existe');
    }

    const [tienePermisoOrigen, tienePermisoDestino] = await Promise.all([
      this._usuarioTienePermisoAlmacen(usuario, traslado.origen),
      this._usuarioTienePermisoAlmacen(usuario, traslado.destino),
    ]);

    if (!tienePermisoOrigen && !tienePermisoDestino) {
      throw boom.forbidden('No tienes permiso para ver los articulos de este traslado.');
    }

    const seriales = await db.serial_de_articulos.findAll({
      where: { cons_movimiento: traslado.consecutivo },
      attributes: ['id', 'cons_producto', 'serial', 'bag_pack', 's_pack', 'm_pack', 'l_pack'],
      order: [['cons_producto', 'ASC']],
    });

    return seriales;
  }

  async find() {
    return await db.traslados.findAll();
  }

  async findOne(consecutivo) {
    const items = await db.historial_movimientos.findAll({
      where: { cons_movimiento: consecutivo },
      include: ['Producto', 'traslado']
    })
    return items;
  }

  async filter(body) {
    const producto = body?.producto?.name || ""
    const categoria = body?.producto?.cons_categoria || ""
    const semana = body?.semana || ""
    if (body?.pagination) {
      let newlimit = parseInt(body.pagination.limit);
      let newoffset = (parseInt(body.pagination.offset) - 1) * newlimit;
      const total = await db.historial_movimientos.count({
        where: {
          [Op.or]: [{ cons_almacen_gestor: { [Op.in]: body.almacenes } }, { cons_almacen_receptor: { [Op.in]: body.almacenes } }],
          cons_lista_movimientos: { [Op.in]: ["TR"] }
        },
        include: [{
          model: db.productos,
          as: "Producto",
          where: { name: { [Op.like]: `%${producto}%` }, cons_categoria: { [Op.like]: `%${categoria}%` } }
        }, {
          model: db.traslados,
          as: "traslado",
          where: { semana: { [Op.like]: `%${semana}%` } }
        }]
      });
      const result = await db.historial_movimientos.findAll({
        where: {
          [Op.or]: [{ cons_almacen_gestor: { [Op.in]: body.almacenes } }, { cons_almacen_receptor: { [Op.in]: body.almacenes } }],
          cons_lista_movimientos: { [Op.in]: ["TR"] }
        },
        include: [{
          model: db.productos,
          as: "Producto",
          where: { name: { [Op.like]: `%${producto}%` }, cons_categoria: { [Op.like]: `%${categoria}%` } }
        }, {
          model: db.traslados,
          as: "traslado",
          where: { semana: { [Op.like]: `%${semana}%` } }
        }],
        limit: newlimit,
        offset: newoffset,
        order: [ ['id', 'DESC']],
      });
      return { data: result, total: total };
    } else {
      const result = await db.historial_movimientos.findAll({
        where: {
          [Op.or]: [{ cons_almacen_gestor: { [Op.in]: body.almacenes } }, { cons_almacen_receptor: { [Op.in]: body.almacenes } }],
          cons_lista_movimientos: { [Op.in]: ["TR"] }
        },
        order: [ ['id', 'DESC']],
        include: [{
          model: db.productos,
          as: "Producto",
          where: { name: { [Op.like]: `%${producto}%` }, cons_categoria: { [Op.like]: `%${categoria}%` } }
        }, {
          model: db.traslados,
          as: "traslado",
          where: { semana: { [Op.like]: `%${semana}%` } }
        }]
      });
      return result
    }
  }

  // Usado solo por PATCH /traslados/modificar/:id, que a su vez solo llama
  // RecibirTraslado.jsx (tanto para "Completar" como para "Rechazar" un
  // traslado del flujo legacy por cantidades — el de seriales usa
  // aceptarTraslado/rechazarTraslado arriba). Antes: sin transaccion, sin
  // guarda contra reprocesar el mismo traslado dos veces, y el movimiento de
  // stock lo hacia el frontend con dos llamadas sueltas (restar/sumar) sin
  // esperar y sin ninguna relacion entre si — si una fallaba y la otra no,
  // el stock quedaba mal sin que nadie se enterara. Ahora todo el
  // movimiento de stock queda adentro de esta unica transaccion.
  async update(id, changes) {
    const t = await db.sequelize.transaction();
    try {
      const traslado = await db.traslados.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!traslado) throw boom.notFound('El item no existe');

      if (changes.estado && traslado.estado !== 'Pendiente') {
        throw boom.conflict(`Este traslado ya fue procesado (estado actual: ${traslado.estado}).`);
      }

      if (changes.estado === 'Completado') {
        const lineas = await db.historial_movimientos.findAll({
          where: { cons_movimiento: traslado.consecutivo },
          transaction: t,
        });

        for (const linea of lineas) {
          await stockService.subtractAmounts(traslado.origen, linea.cons_producto, { cantidad: linea.cantidad }, t);
          await stockService.addAmounts(traslado.destino, linea.cons_producto, { cantidad: linea.cantidad }, t);
        }
      }

      await traslado.update(changes, { transaction: t });
      await t.commit();
      return traslado;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async delete(id) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit, almacenes) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.historial_movimientos.count({
      where: {
        [Op.or]: [{ cons_almacen_gestor: { [Op.in]: almacenes } }, { cons_almacen_receptor: { [Op.in]: almacenes } }],
        cons_lista_movimientos: { [Op.in]: ["TR"] }
      }
    });
    const result = await db.historial_movimientos.findAll({
      where: {
        [Op.or]: [{ cons_almacen_gestor: { [Op.in]: almacenes } }, { cons_almacen_receptor: { [Op.in]: almacenes } }],
        cons_lista_movimientos: { [Op.in]: ["TR"] }
      },
      include: ['Producto', 'traslado'],
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }
}

module.exports = TrasladosService
