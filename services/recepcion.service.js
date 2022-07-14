
const boom = require('@hapi/boom');
const getDate = require('../middlewares/getDate.handler')

class RecepcionService {

  constructor() {}

  async create(data) {
    const { count } = await db.recepcion.findAndCountAll();
    let consecutivo = "RC-" + count;
    const itemNuevo = { consecutivo, ...data, fecha: getDate() }
    await db.recepcion.create(itemNuevo);
    return itemNuevo;
  }

  async findOne(consecutivo) {
    const item = await db.recepcion.findOne({ where: { consecutivo: consecutivo } });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async update(id, changes) {
    const pedido = await db.recepcion.findByPk(id);
    if (!pedido) throw boom.notFound('El item no existe');
    await pedido.update(changes);
    return pedido;
  }

  async delete(id) {
    const item = await db.recepcion.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

}

module.exports = RecepcionService
