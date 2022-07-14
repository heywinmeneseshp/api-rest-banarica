
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const db = require('../models');


class TransportadorasService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id: "TP-0",
      razon_social: "Ramiro Perez",
      direccion: "Calle falsa 123",
      tel: "3226737763",
      email: "heywin1@gmail.com",
      isBlock: false
    });
  }

  async create(data) {
    const {count} = await db.transportadoras.findAndCountAll();
    const consecutivo = "TP-" + count;
    const itemNuevo = { consecutivo, ...data   }
    await db.transportadoras.create(itemNuevo);
    return itemNuevo
  }

  async find() {
    return await db.transportadoras.findAll();
  }

  async findOne(consecutivo) {
    const item = await db.transportadoras.findOne({ where: { consecutivo: consecutivo } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const transportadora = await db.transportadoras.findByPk(id);
    if (!transportadora) throw boom.notFound('El item no existe');
    await transportadora.update(changes)
    return transportadora
  }

  async delete(id) {
    const transportadora = await db.transportadoras.findByPk(id);
    if (!transportadora) throw boom.notFound('El item no existe');
    await transportadora.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }
}

module.exports = TransportadorasService
