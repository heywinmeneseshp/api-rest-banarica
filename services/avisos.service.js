
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const db = require('../models');

class AvisosService {

  constructor() { }


  async create(data) {
    const { count } = await db.avisos.findAndCountAll();
    const consecutivo = generarID("AV", "AV-" + (count));
    const aviso = { consecutivo, ...data };
    await db.avisos.create(aviso);
    return aviso;
  }

  async find() {
    return await db.avisos.findAll();
  }

  async findOne(consecutivo) {
    const aviso = await db.avisos.findOne({ where: { consecutivo } });
    if (!aviso) {
      throw boom.notFound('El aviso no existe')
    }
    return aviso;
  }

  async update(consecutivo, changes) {
    const aviso = await db.avisos.findOne({ where: { consecutivo } });
    if (!aviso) {
      throw boom.notFound('El aviso no existe')
    }
    const result = await db.avisos.update(changes, { where: { consecutivo } });
    return result;
  }

  async delete(consecutivo) {
    const aviso = await db.avisos.findOne({ where: { consecutivo } });
    if (!aviso) {
      throw boom.notFound('El aviso no existe')
    }
    const result = await db.avisos.destroy({ where: { consecutivo } });
  }

}

module.exports = AvisosService
