const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class SAEService {
  async create(data) {
    try {
      const sae = await db.SAE.create(data);
      return sae;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear la SAE');
    }
  }

  async find() {
    return db.SAE.findAll();
  }

  async findOne(id) {
    const sae = await db.SAE.findByPk(id);
    if (!sae) {
      throw boom.notFound('La SAE no existe');
    }
    return sae;
  }

  async update(id, changes) {
    const sae = await db.SAE.findByPk(id);
    if (!sae) {
      throw boom.notFound('La SAE no existe');
    }
    await db.SAE.update(changes, { where: { id } });
    return { message: 'La SAE fue actualizado', id, changes };
  }

  async delete(id) {
    const sae = await db.SAE.findByPk(id);
    if (!sae) {
      throw boom.notFound('La SAE no existe');
    }
    await db.SAE.destroy({ where: { id } });
    return { message: 'La SAE fue eliminado', id };
  }
  
  async paginate(offset, limit, sae = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = sae ? { sae: { [Op.like]: `%${sae}%` } } : {};

    const [result, total] = await Promise.all([
      db.SAE.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.SAE.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = SAEService;
