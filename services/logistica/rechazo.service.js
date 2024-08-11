const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class RechazoService {
  async create(data) {
    try {
      const rechazo = await db.Rechazo.create(data);
      return rechazo;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el rechazo');
    }
  }

  async find() {
    return db.Rechazo.findAll();
  }

  async findOne(id) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    return rechazo;
  }

  async update(id, changes) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    await db.Rechazo.update(changes, { where: { id } });
    return { message: 'El rechazo fue actualizado', id, changes };
  }

  async delete(id) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    await db.Rechazo.destroy({ where: { id } });
    return { message: 'El rechazo fue eliminado', id };
  }

  async paginate(offset, limit, filters = {}) {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = { ...filters };

    const [result, total] = await Promise.all([
      db.Rechazo.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Rechazo.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = RechazoService;
