
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const db = require('../models')

class NotificacionesService {

  constructor() {
    this.notiLista = []
  }

  async create(data) {
    const { count } = await db.notificaciones.findAndCountAll();
    let consecutivo = "NT-" + count
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

  async filterPost(data) {
    var list = data.array
    const items = await db.notificaciones.findAll(
      { where: { aprobado: data.aprobado, visto: data.visto } })
    let lista = []
    items.map(item =>{
      lista.push(item.dataValues)
    })
    var newList = []
    list.map((almacen)=>{
      lista.map((notifacion)=>{
        if(almacen == notifacion.almacen_receptor) newList.push(notifacion)
      })
    })
    return newList.reverse()
  }


  async update(id, changes) {
  const item = await db.notificaciones.findByPk(id);
  if (!item) throw boom.notFound('El item no existe')
  await item.update(changes)
  return item;
}

  async delete (id) {
  const item = await db.notificaciones.findByPk(id);
  if (!item) throw boom.notFound('El item no existe');
  await item.destroy({ where: { id } });
  return { message: "El item fue eliminado" };
}

}

module.exports = NotificacionesService
