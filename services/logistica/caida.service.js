const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class CaidaService {
  async create(data) {
    try {
      const caida = await db.Caida.create(data);
      return caida;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el registro de caida');
    }
  }

  async find() {
    return db.Caida.findAll();
  }

  async findOne(id) {
    const caida = await db.Caida.findByPk(id);
    if (!caida) {
      throw boom.notFound('El registro de caida no existe');
    }
    return caida;
  }

  async update(id, changes) {
    const caida = await this.findOne(id);
    await caida.update(changes);
    return { message: 'El registro de caida fue actualizado', id, changes };
  }

  async delete(id) {
    const caida = await this.findOne(id);
    await caida.destroy();
    return { message: 'El registro de caida fue eliminado', id };
  }

  async paginate(offset, limit, cod_almacen = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = cod_almacen ? { cod_almacen: { [Op.like]: `%${cod_almacen}%` } } : {};

    const [result, total] = await Promise.all([
      db.Caida.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Caida.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = CaidaService;
