
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models');


class TransportadorasService {

  constructor() { }

  async create(data) {
    const { count } = await db.transportadoras.findAndCountAll();
    const consecutivo = "TP-" + count;
    const itemNuevo = { consecutivo, ...data }
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

  async paginate(offset, limit, nombre) {
    if(!nombre) nombre = ""
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const result = await db.transportadoras.findAll({
      where: {razon_social: {[Op.like]: `%${nombre}%`}},
      limit: newlimit,
      offset: newoffset
    });
    const total = await db.transportadoras.count({
      where: {razon_social: {[Op.like]: `%${nombre}%`}}
    });
    return { data: result, total: total };
  }
}

module.exports = TransportadorasService
