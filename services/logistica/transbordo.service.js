const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class TransbordoService {
  async create(data) {
    try {
      const transbordo = await db.Transbordo.create(data);
      return transbordo;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el transbordo');
    }
  }

  async find() {
    return db.Transbordo.findAll();
  }

  async findOne(id) {
    const transbordo = await db.Transbordo.findByPk(id);
    if (!transbordo) {
      throw boom.notFound('El transbordo no existe');
    }
    return transbordo;
  }

  async update(id, changes) {
    const transbordo = await db.Transbordo.findByPk(id);
    if (!transbordo) {
      throw boom.notFound('El transbordo no existe');
    }
    await db.Transbordo.update(changes, { where: { id } });
    return { message: 'El transbordo fue actualizado', id, changes };
  }

  async delete(id) {
    const transbordo = await db.Transbordo.findByPk(id);
    if (!transbordo) {
      throw boom.notFound('El transbordo no existe');
    }
    await db.Transbordo.destroy({ where: { id } });
    return { message: 'El transbordo fue eliminado', id };
  }
  
  async paginate(offset, limit, id_contenedor_viejo = '', id_contenedor_nuevo = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = {
      ...(id_contenedor_viejo && { id_contenedor_viejo: { [Op.like]: `%${id_contenedor_viejo}%` } }),
      ...(id_contenedor_nuevo && { id_contenedor_nuevo: { [Op.like]: `%${id_contenedor_nuevo}%` } }),
    };

    const [result, total] = await Promise.all([
      db.Transbordo.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Transbordo.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = TransbordoService;
