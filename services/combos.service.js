const boom = require('@hapi/boom');
const { generarIDProAndCat } = require('../middlewares/generarId.handler');
const db = require("../models");

class combosService {

  constructor() { }

  async create(data) {
    try {
      const { count } = await db.combos.findAndCountAll();
      const consecutivo = generarIDProAndCat(data.nombre, "xxx" + count);
      const combo = { consecutivo, ...data }
      await db.combos.create(combo);
      return combo
    } catch (error) {
      throw boom.badRequest(error)
    }
  }

  async armarCombo(body) {
    try {
      await db.tabla_combos.create(body);
      return body;
    } catch (error) {
      throw boom.badRequest(error)
    }
  }

  async find() {
    return await db.combos.findAll();
  }

  async findOneCombo(cons_combo) {
    return await db.tabla_combos.findAll({ where: { cons_combo } });
  }

  async findAllCombos() {
    return await db.tabla_combos.findAll();
  }

  async findOne(consecutivo) {
    const combo = await db.combos.findOne({ where: { consecutivo } });
    if (!combo) throw boom.notFound('El combo no existe')
    return combo;
  }

  async update(consecutivo, changes) {
    const existe = await db.combos.findOne({ where: { consecutivo } });
    if (!existe) throw boom.notFound('El combo no existe')
    const combo = await db.combos.update(changes, { where: { consecutivo } });
    return combo;
  }

  async delete(consecutivo) {
    //Eliminar combos
    const combo = await db.combos.findOne({ where: { consecutivo } });
    if (!combo) throw boom.notFound('El combo no existe')
    await db.combos.destroy({ where: { consecutivo } });
    //Eliminar tabla_combos
    await db.tabla_combos.destroy({ where: { cons_combo: consecutivo } });
    return { message: "El combo fue eliminado", consecutivo, }
  }

}

module.exports = combosService
