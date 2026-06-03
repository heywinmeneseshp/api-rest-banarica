const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class tipoMovimientoVehiculosService {
  normalizeMovimiento(value) {
    return String(value || '').trim();
  }
  async create(data) {
    const movimiento = this.normalizeMovimiento(data?.movimiento);
    if (!movimiento) {
      throw boom.badRequest('El movimiento es obligatorio');
    }

    const existe = await db.tipo_movimiento_vehiculos.findOne({
      where: { movimiento },
    });
    if (existe) {
      throw boom.conflict('El tipo de movimiento ya existe');
    }

    return db.tipo_movimiento_vehiculos.create({
      movimiento,
      requiere_contenedor: Boolean(data?.requiere_contenedor),
      activo: typeof data?.activo === 'boolean' ? data.activo : true,
    });
  }
  async find() {
    return db.tipo_movimiento_vehiculos.findAll({
      order: [['movimiento', 'ASC']],
    });
  }

  async findOne(id) {
    const item = await db.tipo_movimiento_vehiculos.findOne({ where: { id } });
    if (!item) {
      throw boom.notFound('El tipo de movimiento no existe');
    }
    return item;
  }

  async update(id, changes) {
    const item = await this.findOne(id);
    const payload = { ...changes };

    if (Object.prototype.hasOwnProperty.call(payload, 'movimiento')) {
      payload.movimiento = this.normalizeMovimiento(payload.movimiento);
      if (!payload.movimiento) {
        throw boom.badRequest('El movimiento es obligatorio');
      }

      const duplicated = await db.tipo_movimiento_vehiculos.findOne({
        where: {
          movimiento: payload.movimiento,
          id: { [Op.ne]: id },
        },
      });
      if (duplicated) {
        throw boom.conflict('El tipo de movimiento ya existe');
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'requiere_contenedor')) {
      payload.requiere_contenedor = Boolean(payload.requiere_contenedor);
    }

    await db.tipo_movimiento_vehiculos.update(payload, { where: { id } });
    return { message: 'El item fue actualizado', id };
  }

  async delete(id) {
    await this.findOne(id);
    await db.tipo_movimiento_vehiculos.destroy({ where: { id } });
    return { message: 'El item fue eliminado', id };
  }

  async paginate(offset, limit, item) {    const newLimit = parseInt(limit, 10);
    const newOffset = (parseInt(offset, 10) - 1) * newLimit;
    const where = {
      movimiento: { [Op.like]: `%${item || ''}%` },
    };

    const total = await db.tipo_movimiento_vehiculos.count({ where });
    const result = await db.tipo_movimiento_vehiculos.findAll({
      where,
      limit: newLimit,
      offset: newOffset,
      order: [['movimiento', 'ASC']],
    });
    return { data: result, total };
  }
}

module.exports = tipoMovimientoVehiculosService;
