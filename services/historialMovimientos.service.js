
const boom = require('@hapi/boom');
const db = require('../models');

class HistorialMovimientosService {

  constructor() { }

  async create(data) {
    await db.historial_movimientos.create(data)
    return data
  }

  async find() {
    return await db.historial_movimientos.findAll();
  }

  async findOne(consecutivo) {
    const items = await db.historial_movimientos.findAll({ where: { cons_movimiento: consecutivo } })
    if (items == 0) throw boom.notFound('El item no existe')
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

}

module.exports = HistorialMovimientosService
