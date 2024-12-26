const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class BuqueService {
  async create(data) {
    try {
      const buque = await db.Buque.create(data);
      return buque;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el buque');
    }
  }

  async find() {
    return db.Buque.findAll();
  }

  async findOne(id) {
    const buque = await db.Buque.findByPk(id);
    if (!buque) {
      throw boom.notFound('El buque no existe');
    }
    return buque;
  }

  async update(id, changes) {
    const buque = await this.findOne(id);
    await buque.update(changes);
    return { message: 'El buque fue actualizado', id, changes };
  }

  async delete(id) {
    const buque = await this.findOne(id);
    await buque.destroy();
    return { message: 'El buque fue eliminado', id };
  }

  async paginate(offset, limit, buque = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = buque ? { buque: { [Op.like]: `%${buque}%` } } : {};

    const [result, total] = await Promise.all([
      db.Buque.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Buque.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = BuqueService;
