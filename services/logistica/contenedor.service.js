const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class ContenedorService {
  async create(data) {
    try {
      const contenedor = await db.Contenedor.create(data);
      return contenedor;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el contenedor');
    }
  }

  async find() {
    return db.Contenedor.findAll();
  }

  async findOne(id) {
    const contenedor = await db.Contenedor.findByPk(id);
    if (!contenedor) {
      throw boom.notFound('El contenedor no existe');
    }
    return contenedor;
  }

  async update(id, changes) {
    const contenedor = await this.findOne(id);
    await contenedor.update(changes);
    return { message: 'El contenedor fue actualizado', id, changes };
  }

  async delete(id) {
    const contenedor = await this.findOne(id);
    await contenedor.destroy();
    return { message: 'El contenedor fue eliminado', id };
  }

  async paginate(offset, limit, contenedorName = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = contenedorName ? { contenedor: { [Op.like]: `%${contenedorName}%` } } : {};

    const [result, total] = await Promise.all([
      db.Contenedor.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Contenedor.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = ContenedorService;
