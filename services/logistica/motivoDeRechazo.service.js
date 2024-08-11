const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class MotivoDeRechazoService {
  async create(data) {
    try {
      const motivoDeRechazo = await db.MotivoDeRechazo.create(data);
      return motivoDeRechazo;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el motivo de rechazo');
    }
  }

  async find() {
    return db.MotivoDeRechazo.findAll();
  }

  async findOne(id) {
    const motivoDeRechazo = await db.MotivoDeRechazo.findByPk(id);
    if (!motivoDeRechazo) {
      throw boom.notFound('El motivo de rechazo no existe');
    }
    return motivoDeRechazo;
  }

  async update(id, changes) {
    const motivoDeRechazo = await db.MotivoDeRechazo.findByPk(id);
    if (!motivoDeRechazo) {
      throw boom.notFound('El motivo de rechazo no existe');
    }
    await db.MotivoDeRechazo.update(changes, { where: { id } });
    return { message: 'El motivo de rechazo fue actualizado', id, changes };
  }

  async delete(id) {
    const motivoDeRechazo = await db.MotivoDeRechazo.findByPk(id);
    if (!motivoDeRechazo) {
      throw boom.notFound('El motivo de rechazo no existe');
    }
    await db.MotivoDeRechazo.destroy({ where: { id } });
    return { message: 'El motivo de rechazo fue eliminado', id };
  }
  
  async paginate(offset, limit, motivo_rechazo = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = motivo_rechazo ? { motivo_rechazo: { [Op.like]: `%${motivo_rechazo}%` } } : {};

    const [result, total] = await Promise.all([
      db.MotivoDeRechazo.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.MotivoDeRechazo.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = MotivoDeRechazoService;
