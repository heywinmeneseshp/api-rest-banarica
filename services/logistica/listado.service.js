const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class ListadoService {
  async create(data) {
    try {
      const listado = await db.Listado.create(data);
      return listado;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el listado');
    }
  }

  async find() {
    return db.Listado.findAll();
  }

  async findOne(id) {
    const listado = await db.Listado.findByPk(id);
    if (!listado) {
      throw boom.notFound('El listado no existe');
    }
    return listado;
  }

  async update(id, changes) {
    const listado = await db.Listado.findByPk(id);
    if (!listado) {
      throw boom.notFound('El listado no existe');
    }
    await db.Listado.update(changes, { where: { id } });
    return { message: 'El listado fue actualizado', id, changes };
  }

  async delete(id) {
    const listado = await db.Listado.findByPk(id);
    if (!listado) {
      throw boom.notFound('El listado no existe');
    }
    await db.Listado.destroy({ where: { id } });
    return { message: 'El listado fue eliminado', id };
  }
  
  async paginate(offset, limit, filters = {}) {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = { ...filters };

    const [result, total] = await Promise.all([
      db.Listado.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Listado.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = ListadoService;
