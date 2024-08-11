const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class ComboClienteService {
  async create(data) {
    try {
      const comboCliente = await db.ComboCliente.create(data);
      return comboCliente;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el combo cliente');
    }
  }

  async find() {
    return db.ComboCliente.findAll();
  }

  async findOne(id) {
    const comboCliente = await db.ComboCliente.findByPk(id);
    if (!comboCliente) {
      throw boom.notFound('El combo cliente no existe');
    }
    return comboCliente;
  }

  async update(id, changes) {
    const comboCliente = await db.ComboCliente.findByPk(id);
    if (!comboCliente) {
      throw boom.notFound('El combo cliente no existe');
    }
    await db.ComboCliente.update(changes, { where: { id } });
    return { message: 'El combo cliente fue actualizado', id, changes };
  }

  async delete(id) {
    const comboCliente = await db.ComboCliente.findByPk(id);
    if (!comboCliente) {
      throw boom.notFound('El combo cliente no existe');
    }
    await db.ComboCliente.destroy({ where: { id } });
    return { message: 'El combo cliente fue eliminado', id };
  }
  
  async paginate(offset, limit, id_cliente = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = id_cliente ? { id_cliente: { [Op.like]: `%${id_cliente}%` } } : {};

    const [result, total] = await Promise.all([
      db.ComboCliente.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.ComboCliente.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = ComboClienteService;
