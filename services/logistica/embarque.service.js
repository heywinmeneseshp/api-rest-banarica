const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class EmbarqueService {
  async create(data) {
    try {
      const embarque = await db.Embarque.create(data);
      return embarque;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el embarque');
    }
  }

  async find() {
    return db.Embarque.findAll();
  }

  async findOne(id) {
    const embarque = await db.Embarque.findByPk(id);
    if (!embarque) {
      throw boom.notFound('El embarque no existe');
    }
    return embarque;
  }

  async update(id, changes) {
    const embarque = await db.Embarque.findByPk(id);
    if (!embarque) {
      throw boom.notFound('El embarque no existe');
    }
    await db.Embarque.update(changes, { where: { id } });
    return { message: 'El embarque fue actualizado', id, changes };
  }

  async delete(id) {
    const embarque = await db.Embarque.findByPk(id);
    if (!embarque) {
      throw boom.notFound('El embarque no existe');
    }
    await db.Embarque.destroy({ where: { id } });
    return { message: 'El embarque fue eliminado', id };
  }
  
  async paginate(offset, limit, filters = {}) {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = { ...filters };

    const [result, total] = await Promise.all([
      db.Embarque.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Embarque.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = EmbarqueService;
