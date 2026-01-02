
const boom = require('@hapi/boom');
const { generarIDSemana } = require("../middlewares/generarId.handler");
const db = require('../models');
const { Op } = require('sequelize');

class SemanasService {

  constructor() {}


  async create(data) {
    const consecutivo = generarIDSemana(data.semana, data.anho);
    const itemNuevo = { consecutivo: consecutivo, ...data }
    await db.semanas.create(itemNuevo);
    return itemNuevo;
  }

  async find() {
    return await db.semanas.findAll();
  }

  async findOne(consecutivo) {
    const semana = await db.semanas.findOne({ where: { consecutivo: consecutivo } });
    if (!semana) throw boom.notFound('El item no existe');
    return semana;
  }

  async filtrar(body) {
   
    try {
      // Destructuramos `createdAt` de body para evitar acceder múltiples veces
      const { createdAt, ...otherBody } = body;
      // Si `createdAt` tiene un array de 2 fechas, aplicamos el filtro
      const filtroFecha = createdAt?.length === 2 ? { createdAt: { [Op.between]: createdAt } } : {};
      // Fusionamos otros filtros y el de la fecha si aplica
      const filtros = { ...otherBody, ...filtroFecha };
      // Realizamos la búsqueda con los filtros
     console.log(filtros);
      const semana = await db.semanas.findAll({ where: filtros });
      // Si no se encuentran resultados, lanzamos un error
      if (!semana || semana.length === 0) {
        throw boom.notFound('El item no existe');
      }
      return semana;
    } catch (error) {
      // Manejamos cualquier otro error que ocurra durante la operación
      throw boom.badImplementation('Error al filtrar los datos', { error });
    }
  }
  

  async update(id, changes) {
    const semana = await db.semanas.findByPk(id);
    if (!semana) throw boom.notFound('El item no existe');
    await semana.update(changes);
    return semana;
  }

  async delete(id) {
    const item = await db.semanas.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginar(offset, limit, consecutivo ) {
    const newOffset = (offset - 1) * limit;
    return await db.semanas.findAll({
        limit: limit,
        offset: newOffset,
        where: { consecutivo: { [Op.like]: `%${consecutivo}%` } }
    });
}


}

module.exports = SemanasService
