
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const db = require('../models')

class DeudasService {

  constructor() {
    this.items = [];
    this.generate();
  }

  async generate(){
    this.items = await db.deudas.findAll()
  }


  async create(data) {
    this.items = await db.deudas.findAll()
    const existe = this.items.filter((item) => item.prestador == data.prestador && item.deudor == data.deudor && item.id_producto == data.id_producto);
    if (existe.length > 0) throw boom.conflict('El item ya existe')
    const ultimoItem = this.items[this.items.length - 1]
    let consecutivo = "DD-0"
    if (ultimoItem) consecutivo = generarID("DD", ultimoItem.consecutivo);
    const itemNuevo = { consecutivo, ...data }
    await db.deudas.create(itemNuevo)
    return itemNuevo
  }

  async filter(prestador, deudor) {
    const result = this.items.filter((item) => item.prestador == prestador && item.deudor == deudor);
    return result
  }


  async find() {
    return await db.deudas.findAll()
  }

  async findOne(consecutivo) {
    const item = await db.deudas.findOne()
    if (!item) {
      throw boom.notFound('El item no existe')
    }
    return item;
  }

  async update(id, changes) {
    const item = await db.deudas.findByPk(id);
    if (!item) throw boom.notFound('El item no existe')
    const rta = await item.update(changes)
    return rta;
  }

  async delete(id) {
    const item = await db.deudas.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado", item: item.consecutivo }
  }

}

module.exports = DeudasService
