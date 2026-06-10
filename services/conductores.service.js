
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const { generarID } = require("../middlewares/generarId.handler");
const db = require("../models");

class ConductoresService {

  constructor() { }

  async create(data) {
    const heywin = await db.conductores.findOne({
      order: [['id', 'DESC']]
    });
    let consecutivo = "CO-1"
    if (heywin) consecutivo = "CO-"+(heywin.id*1);
    console.log(consecutivo)
    const conductor = {
      consecutivo,
      conductor: String(data?.conductor || '').trim().toUpperCase(),
      cons_transportadora: String(data?.cons_transportadora || '').trim(),
      email: String(data?.email || '').trim(),
      tel: String(data?.tel || data?.telefono || '').trim(),
      licencia: String(data?.licencia || '').trim(),
      isBlock: Boolean(data?.isBlock),
    };
    const created = await db.conductores.create(conductor);
    return created;
  }

  async find() {
    return await db.conductores.findAll({
      order: [['id', 'DESC']]
    });
  }

  async findOne(consecutivo) {
    const item = await db.conductores.findOne({ where: { consecutivo } });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async update(consecutivo, changes) {
    try {
      const item = await db.conductores.findOne({ where: { consecutivo } });
      if (!item) throw boom.notFound('El item no existe');
      const payload = {
        ...changes,
        conductor: changes?.conductor ? String(changes.conductor).trim().toUpperCase() : changes?.conductor,
        cons_transportadora: String(changes?.cons_transportadora || '').trim(),
        email: String(changes?.email || '').trim(),
        tel: String(changes?.tel || changes?.telefono || '').trim(),
      };
      await db.conductores.update(payload, { where: { consecutivo } });
      return { message: "El item fue actualizado", consecutivo, changes }
    } catch (error) {
      throw boom.badRequest(error);
    }
  };

  async delete(consecutivo) {
    try {
      const item = await db.conductores.findOne({ where: { consecutivo } });
      if (!item) throw boom.notFound('El item no existe');
      await db.conductores.destroy({ where: { consecutivo } });
      return { message: "El item fue eliminado", consecutivo, }
    } catch (error) {
      throw boom.badRequest(error);
    }
  }

  async paginate(offset, limit, nombre) {
    if (!nombre) nombre = ""
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const result = await db.conductores.findAll({
      where: { conductor: { [Op.like]: `%${nombre}%` } },
      order: [['id', 'DESC']],
      limit: newlimit,
      offset: newoffset
    });
    const total = await db.conductores.count({
      where: { conductor: { [Op.like]: `%${nombre}%` } }
    });
    return { data: result, total: total };
  }
}

module.exports = ConductoresService
