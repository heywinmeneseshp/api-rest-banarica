
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require("../models");

class ConductoresService {

  constructor() { }

  async buildConsecutivo() {
    const last = await db.conductores.findOne({
      order: [['id', 'DESC']]
    });
    let nextId = Number(last?.id || 0) + 1;
    let consecutivo = `CO-${nextId}`;

    while (await db.conductores.findOne({ where: { consecutivo } })) {
      nextId += 1;
      consecutivo = `CO-${nextId}`;
    }

    return consecutivo;
  }

  async findByIdentifier(identifier) {
    const where = /^\d+$/.test(String(identifier))
      ? { id: identifier }
      : { consecutivo: identifier };

    const item = await db.conductores.findOne({
      where,
      include: [
        {
          model: db.transportadoras,
          as: "transportadora",
          attributes: ['id', 'razon_social']
        }
      ]
    });

    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  normalizePayload(data = {}, partial = false) {
    const payload = {};
    const assignIfPresent = (field, value) => {
      if (!partial || Object.prototype.hasOwnProperty.call(data, field)) {
        payload[field] = value;
      }
    };

    assignIfPresent('consecutivo', data?.consecutivo ? String(data.consecutivo).trim().toUpperCase() : undefined);
    assignIfPresent('conductor', data?.conductor ? String(data.conductor).trim().toUpperCase() : data?.conductor);
    assignIfPresent('cons_transportadora', String(data?.cons_transportadora || '').trim());
    assignIfPresent('email', String(data?.email || '').trim());
    assignIfPresent('tel', String(data?.tel || data?.telefono || '').trim());
    assignIfPresent('licencia', String(data?.licencia || '').trim());
    assignIfPresent('isBlock', Boolean(data?.isBlock));

    Object.keys(payload).forEach((key) => {
      if (typeof payload[key] === 'undefined') {
        delete payload[key];
      }
    });

    return payload;
  }

  async create(data) {
    const consecutivo = data?.consecutivo
      ? String(data.consecutivo).trim().toUpperCase()
      : await this.buildConsecutivo();

    const exists = await db.conductores.findOne({ where: { consecutivo } });
    if (exists) {
      throw boom.conflict(`Ya existe un conductor con el codigo ${consecutivo}`);
    }

    const conductor = {
      ...this.normalizePayload(data),
      consecutivo,
    };
    const created = await db.conductores.create(conductor);
    return created;
  }

  async find() {
    return await db.conductores.findAll({
      include: [
        {
          model: db.transportadoras,
          as: "transportadora",
          attributes: ['id', 'razon_social']
        }
      ],
      order: [['id', 'DESC']]
    });
  }

  async findOne(identifier) {
    return this.findByIdentifier(identifier);
  }

  async update(identifier, changes) {
    try {
      const item = await this.findByIdentifier(identifier);
      const payload = this.normalizePayload(changes, true);
      await item.update(payload);
      return { message: "El item fue actualizado", id: item.id, consecutivo: item.consecutivo, changes: payload }
    } catch (error) {
      throw boom.badRequest(error);
    }
  };

  async delete(identifier) {
    try {
      const item = await this.findByIdentifier(identifier);
      await item.destroy();
      return { message: "El item fue eliminado", id: item.id, consecutivo: item.consecutivo }
    } catch (error) {
      throw boom.badRequest(error);
    }
  }

  async paginate(offset, limit, nombre, transportadoraId = '') {
    if (!nombre) nombre = ""
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const where = {
      [Op.and]: [
        {
          [Op.or]: [
            { conductor: { [Op.like]: `%${nombre}%` } },
            { consecutivo: { [Op.like]: `%${nombre}%` } },
            { licencia: { [Op.like]: `%${nombre}%` } },
            { tel: { [Op.like]: `%${nombre}%` } },
            { email: { [Op.like]: `%${nombre}%` } },
          ]
        }
      ]
    };

    if (transportadoraId) {
      where[Op.and].push({ cons_transportadora: String(transportadoraId) });
    }

    const result = await db.conductores.findAll({
      where,
      include: [
        {
          model: db.transportadoras, 
          as: "transportadora",
          attributes: ['id', 'razon_social']
        }
      ],
      order: [['id', 'DESC']],
      limit: newlimit,
      offset: newoffset
    });
    const total = await db.conductores.count({
      where
    });
    return { data: result, total: total };
  }
}

module.exports = ConductoresService
