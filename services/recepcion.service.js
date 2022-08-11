
const db = require('../models');
const boom = require('@hapi/boom');

class RecepcionService {

  constructor() {}

  async create(data) {
    const { count } = await db.movimientos.findAndCountAll();
    let consecutivo = "RC-" + count;
    const itemNuevo = { consecutivo, ...data }
    await db.movimientos.create(itemNuevo);
    return itemNuevo;
  }

  async find() {
    const item = await db.movimientos.findAll({});
    return item;
  }

  async findOne(consecutivo) {
    const item = await db.movimientos.findOne({ where: { consecutivo: consecutivo },
      include: ['historial_movimientos'] });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async update(id, changes) {
    const pedido = await db.movimientos.findByPk(id);
    if (!pedido) throw boom.notFound('El item no existe');
    await pedido.update(changes);
    return pedido;
  }

  async delete(id) {
    const item = await db.movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset)-1 )* newlimit;
    const result = await db.movimientos.findAll({
    limit: newlimit,
    offset: newoffset
    });
    return result;
  }



}

module.exports = RecepcionService
