
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const { generarID } = require("../middlewares/generarId.handler");
const db = require("../models");

class ConductoresService {

  constructor() { }

  async create(data) {
    const heywin = await this.find();
    let consecutivo = "CO-0"
    if (heywin.length > 0) consecutivo = generarID("CO", heywin[heywin.length - 1].consecutivo);
    const conductor = { consecutivo, ...data };
    await db.conductores.create(conductor);
    return conductor;
  }

  async find() {
    return await db.conductores.findAll();
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
      await db.conductores.update(changes, { where: { consecutivo } });
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
