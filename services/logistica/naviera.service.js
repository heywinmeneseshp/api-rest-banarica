const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class NavieraService {
  async create(data) {
    try {
      const naviera = await db.Naviera.create(data);
      return naviera;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear la naviera');
    }
  }

  async find() {
    return db.Naviera.findAll();
  }

  async findOne(id) {
    const naviera = await db.Naviera.findByPk(id);
    if (!naviera) {
      throw boom.notFound('La naviera no existe');
    }
    return naviera;
  }

  async update(id, changes) {
    const naviera = await db.Naviera.findByPk(id);
    if (!naviera) {
      throw boom.notFound('La naviera no existe');
    }
    await db.Naviera.update(changes, { where: { id } });
    return { message: 'La naviera fue actualizada', id, changes };
  }

  async delete(id) {
    const naviera = await db.Naviera.findByPk(id);
    if (!naviera) {
      throw boom.notFound('La naviera no existe');
    }
    await db.Naviera.destroy({ where: { id } });
    return { message: 'La naviera fue eliminada', id };
  }

  async paginate(offset, limit, body = {}) {

    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = {...body,
      navieras: { [Op.like]: `%${body.navieras ? body.navieras : ""}%` },
      cod: { [Op.like]: `%${body.cod ? body.cod : ""}%` },
    }
 
    const [result, total] = await Promise.all([
      db.Naviera.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Naviera.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = NavieraService;
