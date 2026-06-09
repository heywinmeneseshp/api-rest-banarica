const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');
const { normalizeRole, ROLES } = require('../../middlewares/auth.handler');

class vehiculoService {
  normalizePayload(data = {}) {
    return {
      vehiculo: String(data?.vehiculo || '').trim(),
      modelo: String(data?.modelo || '').trim(),
      placa: String(data?.placa || '').trim().toUpperCase(),
      conductor_id: data?.conductor_id || null,
      categoria_id: data?.categoria_id || null,
      transportadoraId: data?.transportadoraId || data?.id_transportadora || null,
      combustible: data?.combustible === '' || data?.combustible == null ? 0 : Number(data.combustible),
      gal_por_km: data?.gal_por_km === '' || data?.gal_por_km == null ? 0 : Number(data.gal_por_km),
      activo: typeof data?.activo === 'boolean' ? data.activo : data?.activo !== 'false',
    };
  }

  async getAllowedTransportadoras(user) {
    if (!user?.username || normalizeRole(user.id_rol) === ROLES.SUPER_ADMIN) {
      return null;
    }

    const asignaciones = await db.transportadoras_por_usuario.findAll({
      where: { username: user.username, habilitado: true }
    });

    return asignaciones.map((item) => item.id_transportadora);
  }

  async buildWhereWithTransportadora(baseWhere = {}, user = null, transportadoraId = null) {
    const where = { ...baseWhere };
    const allowed = await this.getAllowedTransportadoras(user);

    if (transportadoraId) {
      where.transportadoraId = transportadoraId;
    }

    if (Array.isArray(allowed)) {
      if (!allowed.length) {
        where.transportadoraId = { [Op.in]: [] };
        return where;
      }

      if (where.transportadoraId) {
        where.transportadoraId = allowed.includes(Number(where.transportadoraId)) || allowed.includes(String(where.transportadoraId))
          ? where.transportadoraId
          : { [Op.in]: [] };
        return where;
      }

      where.transportadoraId = { [Op.in]: allowed };
    }

    return where;
  }

  validateTransportadora(payload) {
    if (!payload.transportadoraId) {
      throw boom.badRequest('Debes asignar una transportadora al vehiculo');
    }
  }

  async create(data) {
    const payload = this.normalizePayload(data);
    this.validateTransportadora(payload);
    const existe = await db.vehiculo.findOne({ where: { placa: payload.placa } });
    if (existe) throw boom.conflict(`Ya existe un vehiculo con la placa ${payload.placa}`);
    const newAlamacen = await db.vehiculo.create(payload);
    return newAlamacen;
  }

  async bulkCreate(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw boom.badRequest('El archivo no contiene registros para cargar.');
    }

    const transaction = await db.sequelize.transaction();
    try {
      const payloads = dataArray.map((item) => this.normalizePayload(item));
      payloads.forEach((payload) => this.validateTransportadora(payload));
      const placas = payloads.map((item) => item.placa).filter(Boolean);
      const existentes = await db.vehiculo.findAll({
        where: { placa: { [Op.in]: placas } },
        transaction,
      });

      if (existentes.length > 0) {
        throw boom.conflict(`Ya existen vehiculos con estas placas: ${existentes.map((item) => item.placa).join(', ')}`);
      }

      const result = await db.vehiculo.bulkCreate(payloads, {
        validate: true,
        transaction,
      });

      await transaction.commit();
      return { message: 'Carga masiva exitosa', total: result.length };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async bulkUpdate(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw boom.badRequest('El archivo no contiene registros para actualizar.');
    }

    const transaction = await db.sequelize.transaction();
    try {
      let updated = 0;
      for (const row of dataArray) {
        const placa = String(row?.placa || '').trim().toUpperCase();
        if (!placa) {
          throw boom.badRequest('Todos los registros de actualizacion masiva deben incluir la placa.');
        }

        const item = await db.vehiculo.findOne({ where: { placa }, transaction });
        if (!item) {
          throw boom.notFound(`No existe un vehiculo con la placa ${placa}`);
        }

        const payload = this.normalizePayload({ ...item.toJSON(), ...row, placa });
        this.validateTransportadora(payload);
        await item.update(payload, { transaction });
        updated += 1;
      }

      await transaction.commit();
      return { message: 'Actualizacion masiva exitosa', total: updated };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async find(user = null, filters = {}) {
    const where = await this.buildWhereWithTransportadora({}, user, filters.transportadoraId);
    const vehiculo = await db.vehiculo.findAll({
      where,
      include: [{ model: db.transportadoras, as: 'transportadora' }]
    });
    return vehiculo;
  }

  async findOne(id) {
    const item = await db.vehiculo.findOne({
      where: { id },
      include: [{ model: db.transportadoras, as: 'transportadora' }]
    });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async update(id, changes) {
    const item = await db.vehiculo.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe');
    const payload = this.normalizePayload({ ...item.toJSON(), ...changes });
    this.validateTransportadora(payload);
    const existe = await db.vehiculo.findOne({ where: { placa: payload.placa } });
    if (existe && String(existe.id) !== String(id)) {
      throw boom.conflict(`Ya existe un vehiculo con la placa ${payload.placa}`);
    }
    const result = await db.vehiculo.update(payload, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.vehiculo.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.vehiculo.destroy({ where: { id } });
    return { message: 'El item fue eliminado', id };
  }

  async paginate(offset, limit, item, user = null, filters = {}) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const where = await this.buildWhereWithTransportadora(
      { placa: { [Op.like]: `%${item || ''}%` } },
      user,
      filters.transportadoraId
    );
    const total = await db.vehiculo.count({
      where
    });
    const result = await db.vehiculo.findAll({
      where,
      include: [{ model: db.transportadoras, as: 'transportadora' }],
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }
}

module.exports = vehiculoService
