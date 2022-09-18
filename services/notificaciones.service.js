
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models')

class NotificacionesService {


  async create(data) {
    let consecutivo = "NT-" + (Date.now()-1662564279341);
    const itemNuevo = await { consecutivo, ...data }
    await db.notificaciones.create(itemNuevo)
    return itemNuevo
  }

  async find() {
    let result = await db.notificaciones.findAll()
    return result.reverse()
  }

  async findOne(consecutivo) {
    const item = await db.notificaciones.findOne({ where: { consecutivo: consecutivo } })
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async filter(body) {
    let items = await db.notificaciones.findAll({ where: body })
    return items.reverse();
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
