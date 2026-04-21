
const boom = require('@hapi/boom');
const { Op } = require("sequelize");
const db = require('../models');
const StockService = require('./stock.service');
const HistorialMovimientosService = require('./historialMovimientos.service');

const stockService = new StockService();
const historialService = new HistorialMovimientosService();

class TrasladosService {

  constructor() {
  }

  async create(data, transaction = null) {
    const { count } = await db.traslados.findAndCountAll();
    const consecutivo = "TR-" + count;
    const itemNuevo = { consecutivo, ...data }
    const res = await db.traslados.create(itemNuevo, transaction ? { transaction } : undefined);
    return res
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

  async update(id, changes) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.update(changes)
    return traslados
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
