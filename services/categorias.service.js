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
  
  async bulkCreate(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0)
      throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
    const transaction = await db.sequelize.transaction();
    try {
      const results = await db.categorias.bulkCreate(dataArray, { validate: true, transaction });
      await transaction.commit();
      return { message: 'Carga masiva exitosa', count: results.length };
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError')
        throw boom.conflict(`El código '${error.errors?.[0]?.value}' ya existe.`);
      if (error.name === 'SequelizeValidationError')
        throw boom.badRequest('Error de validación.', { detalles: error.errors.map(e => e.message) });
      throw boom.internal('Error interno del servidor.');
    }
  }

  async bulkUpdate(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0)
      throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
    const results = [], errors = [];
    for (let i = 0; i < dataArray.length; i++) {
      const { consecutivo, ...rest } = dataArray[i];
      if (!consecutivo) { errors.push({ fila: i + 1, message: 'consecutivo requerido' }); continue; }
      const item = await db.categorias.findOne({ where: { consecutivo } });
      if (!item) { errors.push({ fila: i + 1, consecutivo, message: `Categoría "${consecutivo}" no encontrada` }); continue; }
      const changes = {};
      for (const campo of ['nombre', 'isBlock']) {
        if (rest[campo] !== undefined) changes[campo] = rest[campo];
      }
      if (!Object.keys(changes).length) { errors.push({ fila: i + 1, consecutivo, message: 'Sin campos válidos' }); continue; }
      await db.categorias.update(changes, { where: { consecutivo } });
      results.push({ fila: i + 1, consecutivo, status: 'ok' });
    }
    return { message: `Actualización completada. ${results.length} exitosos, ${errors.length} errores.`, total: results.length, errors: errors.length, errorDetails: errors };
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
