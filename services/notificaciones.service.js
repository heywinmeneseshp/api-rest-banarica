
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const db = require('../models')

class NotificacionesService {

  constructor() { }

  async create(data) {
    const { count } = await db.notificaciones.findAndCountAll();
    let consecutivo = "NT-" + count
    const itemNuevo = await { consecutivo, ...data }
    await db.notificaciones.create(itemNuevo)
    return itemNuevo
  }

  async find() {
    return await db.notificaciones.findAll()
  }

  async findOne(consecutivo) {
    const item = await db.notificaciones.findOne({ where: { consecutivo: consecutivo } })
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async filter(body) {
    const items = await db.notificaciones.findAll({ where: body })
    return items;

  }

  async update(id, changes) {
    const item = await db.notificaciones.findByPk(id);
    if (!item) throw boom.notFound('El item no existe')
    await item.update(changes)
    return item;
  }

  async delete(id) {
    const item = await db.notificaciones.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

}

module.exports = NotificacionesService
