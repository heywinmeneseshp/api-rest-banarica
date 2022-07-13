
const boom = require('@hapi/boom');
const db = require('../models');

class AlmacenesService {

  constructor() {
    this.almacenes = [];
  }

  async create(data) {
    const existe = await db.almacenes.findOne({ where: { consecutivo: data.consecutivo } });
    if (existe) throw boom.conflict('El almacen ya existe')
    const newAlamacen = await db.almacenes.create(data);
    return newAlamacen
  }

  async find() {
    return await db.almacenes.findAll();
  }

  async findOne(consecutivo) {
    const almacen = await db.almacenes.findOne({ where: { consecutivo } });
    if (!almacen) throw boom.notFound('El almacen no existe')
    return almacen;
  }

  async update(consecutivo, changes) {
    const almacen = await db.almacenes.findOne({ where: { consecutivo } });
    if (!almacen) throw boom.notFound('El almacen no existe')
    const result = await db.almacenes.update(changes, { where: { consecutivo } });
    return result;
  }

  async delete(consecutivo) {
    const existe = await db.almacenes.findOne({ where: { consecutivo } });
    if (!existe) throw boom.notFound('El almacen no existe');
    await db.almacenes.destroy({ where: { consecutivo } });
    return { message: "El almacen fue eliminado", consecutivo }
  }

}

module.exports = AlmacenesService
