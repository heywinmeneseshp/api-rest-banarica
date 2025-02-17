const boom = require('@hapi/boom');
const { Op } = require('sequelize');
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

  async bulkCreate(dataArray) {
    const transaction = await db.sequelize.transaction(); // Inicia la transacción
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
      }
  
      console.log(dataArray);
  
      const results = await db.combos.bulkCreate(dataArray, { 
        validate: true,
        transaction // Pasa la transacción
      });
  
      await transaction.commit(); // Confirma la transacción si todo salió bien
  
      return { message: 'Carga masiva exitosa', count: results.length };
    } catch (error) {
      await transaction.rollback(); // Revierte los cambios si hay error
      console.error("Error en bulkCreate:", error);
  
      if (error.name === "SequelizeUniqueConstraintError") {
        const codExistente = error.errors?.[0]?.value || "desconocido";
        throw boom.conflict(`El código '${codExistente}' ya existe. Debe ser único.`);
      }
  
      if (error.name === "SequelizeValidationError") {
        const detalles = error.errors.map(err => err.message);
        throw boom.badRequest("Error de validación en los datos.", { detalles });
      }
  
      throw boom.internal("Error interno del servidor al crear el item.");
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

  async paginate(offset, limit, nombre) {
    if(!nombre) nombre = ""
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const result = await db.combos.findAll({
      where: { nombre: { [Op.like]: `%${nombre}%` } },
      limit: newlimit,
      offset: newoffset,
      order: [['id', 'DESC']] // Ordenar por id en orden descendente
    });
    const total = await db.combos.count({
      where: { nombre: { [Op.like]: `%${nombre}%` } },
    });
    return { data: result, total: total };
  }

}

module.exports = combosService
