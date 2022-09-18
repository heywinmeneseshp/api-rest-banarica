
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

  async generalFilter(body) {
    if (!body?.producto?.name) body = { ...body, producto: { name: "" } }
    if (body?.pagination) {
      let newlimit = parseInt(body.pagination.limit);
      let newoffset = (parseInt(body.pagination.offset) - 1) * newlimit;
      if (body?.movimiento) {
        const moveList = await db.movimientos.findAll({ where: body.movimiento })
        let list = moveList.map(item => item.consecutivo)
        const items = await db.historial_movimientos.findAll({
          where: { cons_lista_movimientos: { [Op.ne]: ["TR"] }, ...body.historial, cons_movimiento: list },
          include: [{
            model: db.productos,
            as: "Producto",
            where: { name: { [Op.like]: `%${body?.producto?.name}%` } }
          }, 'movimiento'],
          limit: newlimit,
          offset: newoffset
        })
        const total = await db.historial_movimientos.count({
          where: {
            cons_lista_movimientos: { [Op.ne]: ["TR"] },
            ...body.historial,
            cons_movimiento: list
          },
          include: [{
            model: db.productos,
            as: "Producto",
            where: { name: { [Op.like]: `%${body?.producto?.name}%` } }
          }, 'movimiento']
        })
        return { data: items, total: total };
      } else {
        const items = await db.historial_movimientos.findAll({
          where: { cons_lista_movimientos: { [Op.ne]: ["TR"] }, ...body.historial },
          include: [{
            model: db.productos,
            as: "Producto",
            where: { name: { [Op.like]: `%${body?.producto?.name}%` } }
          }, 'movimiento'],
          limit: newlimit,
          offset: newoffset
        })
        const total = await db.historial_movimientos.count({
          where: { cons_lista_movimientos: { [Op.ne]: ["TR"] }, ...body.historial },
          include: [{
            model: db.productos,
            as: "Producto",
            where: { name: { [Op.like]: `%${body?.producto?.name}%` } }
          }, 'movimiento']
        })
        return { data: items, total: total };
      }
    } else {
      if (body?.movimiento) {
        const moveList = await db.movimientos.findAll({ where: body.movimiento })
        let list = moveList.map(item => item.consecutivo)
        const items = await db.historial_movimientos.findAll({
          where: { cons_lista_movimientos: { [Op.ne]: ["TR"] }, ...body.historial, cons_movimiento: list },
          include: [{
            model: db.productos,
            as: "Producto",
            where: { name: { [Op.like]: `%${body?.producto?.name}%` } }
          }, 'movimiento']
        })
        return items;
      } else {
        const items = await db.historial_movimientos.findAll({
          where: { cons_lista_movimientos: { [Op.ne]: ["TR"] }, ...body.historial },
          include: [{
            model: db.productos,
            as: "Producto",
            where: { name: { [Op.like]: `%${body?.producto?.name}%` } }
          }, 'movimiento']
        })
        return items;
      }
    }
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
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.historial_movimientos.count({
      where: {
        cons_almacen_gestor: { [Op.in]: almacenes },
        cons_lista_movimientos: { [Op.ne]: ["TR"] }
      }
    });
    const result = await db.historial_movimientos.findAll({
      where: {
        cons_almacen_gestor: { [Op.or]: almacenes },
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
