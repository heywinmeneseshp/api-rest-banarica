const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class MotivoDeUsoService {
  async create(data) {
    try {
      const MotivoDeUso = await db.MotivoDeUso.create(data);
      return MotivoDeUso;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear El MotivoDeUso');
    }
  }

  async find() {
    return db.MotivoDeUso.findAll();
  }

  async findOne(id) {
    const MotivoDeUso = await db.MotivoDeUso.findByPk(id);
    if (!MotivoDeUso) {
      throw boom.notFound('El MotivoDeUso no existe');
    }
    return MotivoDeUso;
  }

  async update(id, changes) {
    const MotivoDeUso = await db.MotivoDeUso.findByPk(id);
    if (!MotivoDeUso) {
      throw boom.notFound('El MotivoDeUso no existe');
    }
    await db.MotivoDeUso.update(changes, { where: { id } });
    return { message: 'El MotivoDeUso fue actualizado', id, changes };
  }

  async delete(id) {
    const MotivoDeUso = await db.MotivoDeUso.findByPk(id);
    if (!MotivoDeUso) {
      throw boom.notFound('El MotivoDeUso no existe');
    }
    await db.MotivoDeUso.destroy({ where: { id } });
    return { message: 'El MotivoDeUso fue eliminado', id };
  }
  
  async paginate(offset, limit, MotivoDeUso = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = MotivoDeUso ? { MotivoDeUso: { [Op.like]: `%${MotivoDeUso}%` } } : {};

    const [result, total] = await Promise.all([
      db.MotivoDeUso.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.MotivoDeUso.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = MotivoDeUsoService;
