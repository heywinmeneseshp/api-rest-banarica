
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models');

class HistorialMovimientosService {

  constructor() { }

  async create(data) {
    await db.historial_movimientos.create(data)
    return data
  }

  async find() {
    return await db.historial_movimientos.findAll({ include: ['Producto', 'movimiento'] });
  }

  async findOne(consecutivo) {
    const items = await db.historial_movimientos.findAll({
      where: { cons_movimiento: consecutivo },
      include: ['Producto', 'movimiento']
    })
    if (items == 0) throw boom.notFound('El item no existe')
    return items;
  }

  async filter(body) {
    const items = await db.historial_movimientos.findAll({ where: body, include: ['Producto', 'movimiento'] })
    return items;

  }

  async update(id, changes) {
    const item = await db.historial_movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe')
    await item.update(changes)
    return item;
  }

  async delete(id) {
    const item = await db.historial_movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit, almacenes) {
    let almacenesCons = almacenes.map(almacen => almacen.consecutivo);
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.historial_movimientos.count({
      where: {
        cons_almacen_gestor: { [Op.in]: almacenesCons },
        cons_lista_movimientos: { [Op.ne]: ["TR"] }
      }
    });
    const result = await db.historial_movimientos.findAll({
      where: {
        cons_almacen_gestor: { [Op.or]: almacenesCons },
        cons_lista_movimientos: { [Op.ne]: ["TR"] }
      },
      include: ['Producto', 'movimiento'],
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = HistorialMovimientosService
