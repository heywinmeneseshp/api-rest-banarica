const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const { generarIDProAndCat } = require('../middlewares/generarId.handler');
const db = require('../models');

class CategoriasService {
  async create(data) {
    try {
      const count = await db.categorias.count();
      const consecutivo = generarIDProAndCat(data.nombre, `xxx${count}`);
      const categoria = { consecutivo, ...data };
      await db.categorias.create(categoria);
      return categoria;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear la categoría');
    }
  }

  async find() {
    return db.categorias.findAll();
  }

  async findOne(consecutivo) {
    const categoria = await db.categorias.findOne({ where: { consecutivo } });
    if (!categoria) {
      throw boom.notFound('La categoría no existe');
    }
    return categoria;
  }

  async update(consecutivo, changes) {
    const categoria = await db.categorias.findOne({ where: { consecutivo } });
    if (!categoria) {
      throw boom.notFound('La categoría no existe');
    }
    await db.categorias.update(changes, { where: { consecutivo } });
    return { message: 'La categoría fue actualizada', consecutivo, changes };
  }

  async delete(consecutivo) {
    const categoria = await db.categorias.findOne({ where: { consecutivo } });
    if (!categoria) {
      throw boom.notFound('La categoría no existe');
    }
    await db.categorias.destroy({ where: { consecutivo } });
    return { message: 'La categoría fue eliminada', consecutivo };
  }
  
  async paginate(offset, limit, nombre = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = nombre ? { nombre: { [Op.like]: `%${nombre}%` } } : {};

    const [result, total] = await Promise.all([
      db.categorias.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.categorias.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = CategoriasService;
