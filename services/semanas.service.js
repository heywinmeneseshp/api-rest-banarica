
const boom = require('@hapi/boom');
const { generarIDSemana } = require("../middlewares/generarId.handler");
const db = require('../models');

class SemanasService {

  constructor() {}


  async create(data) {
    const consecutivo = generarIDSemana(data.semana, data.anho);
    const itemNuevo = { consecutivo: consecutivo, ...data }
    await db.semanas.create(itemNuevo);
    return itemNuevo;
  }

  async find() {
    return await db.semanas.findAll();
  }

  async findOne(consecutivo) {
    const semana = await db.semanas.findOne({ where: { consecutivo: consecutivo } });
    if (!semana) throw boom.notFound('El item no existe');
    return semana;
  }

  async update(id, changes) {
    const semana = await db.semanas.findByPk(id);
    if (!semana) throw boom.notFound('El item no existe');
    await semana.update(changes);
    return semana;
  }

  async delete(id) {
    const item = await db.semanas.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }
}

module.exports = SemanasService
