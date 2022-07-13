const boom = require('@hapi/boom');
const { generarIDProAndCat } = require('../middlewares/generarId.handler');
const db = require('../models');

class CategoriasService {

  constructor() {}

  generate() {
    this.categorias.push({
      id: "CAR1",
      nombre: "CARTON",
      isBlock: false
    });

  }

  async create(data) {
    try {
      const { count } = await db.categorias.findAndCountAll();
      const consecutivo = generarIDProAndCat(data.nombre, "xxx" + (count));
      const categoria = { consecutivo, ...data };
      await db.categorias.create(categoria);
      return categoria;
    } catch (error) {
      throw boom.badRequest(error)
    }
  }

  async find() {
    return await db.categorias.findAll();
  }

  async findOne(consecutivo) {
    const categoria = await db.categorias.findOne({ where: { consecutivo } });
    if (!categoria) {
      throw boom.notFound('La categoria no existe')
    }
    return categoria;
  }

  async update(consecutivo, changes) {
    const existe = await db.categorias.findOne({ where: { consecutivo } });
    if (!existe) {
      throw boom.notFound('La categoria no existe')
    }
    const result = await db.categorias.update(changes, { where: { consecutivo } });
    return result;
  }

  async delete(consecutivo) {
    const existe = await db.categorias.findOne({ where: { consecutivo } });
    if (!existe) {
      throw boom.notFound('La categoria no existe')
    }
    await db.categorias.destroy({ where: { consecutivo } });
    return { message: "La categoria fue eliminado", consecutivo, }
  }

}

module.exports = CategoriasService
