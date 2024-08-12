const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class DestinoService {
  async create(data) {
    try {
      
      const destino = await db.Destino.create(data);
      return destino;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el destino');
    }
  }

  async find() {
    return db.Destino.findAll();
  }

  async findOne(id) {
    const destino = await db.Destino.findOne({ where: { id } });
    if (!destino) {
      throw boom.notFound('El destino no existe');
    }
    return destino;
  }

  async update(id, changes) {
    const destino = await db.Destino.findOne({ where: { id } });
    if (!destino) {
      throw boom.notFound('El destino no existe');
    }
    await db.Destino.update(changes, { where: { id } });
    return { message: 'El destino fue actualizado', id, changes };
  }

  async delete(id) {
    const destino = await db.Destino.findOne({ where: { id } });
    if (!destino) {
      throw boom.notFound('El destino no existe');
    }
    await db.Destino.destroy({ where: { id } });
    return { message: 'El destino fue eliminado', id };
  }
  
  async paginate(offset, limit, destino = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = destino ? { destino: { [Op.like]: `%${destino}%` } } : {};

    const [result, total] = await Promise.all([
      db.Destino.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Destino.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = DestinoService;
