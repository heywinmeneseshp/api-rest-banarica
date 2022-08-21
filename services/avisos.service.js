
const boom = require('@hapi/boom');
const db = require('../models');

class AvisosService {

  constructor() { }

  async create(data) {
    const aviso = await db.avisos.create(data);
    return aviso;
  }

  async find() {
    return await db.avisos.findAll();
  }

  async findOne(id) {
    const aviso = await db.avisos.findOne({ where: { id } });
    if (!aviso) {
      throw boom.notFound('El aviso no existe')
    }
    return aviso;
  }

  async update(id, changes) {
    const aviso = await db.avisos.findOne({ where: { id } });
    if (!aviso) {
      throw boom.notFound('El aviso no existe')
    }
    const result = await db.avisos.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const aviso = await db.avisos.findOne({ where: { id } });
    if (!aviso) {
      throw boom.notFound('El aviso no existe')
    }
    const result = await db.avisos.destroy({ where: { id } });
  }

}

module.exports = AvisosService
