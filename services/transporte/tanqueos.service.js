
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class tanqueosService {

  async create(data) {
    console.log(data)
    const existe = await db.tanqueos.findOne({ where: data });
    if (existe) throw boom.conflict('El item ya existe')
    const newAlamacen = await db.tanqueos.create(data);
    return newAlamacen
  }

  async find() {
    const res = await db.tanqueos.findAll()
    return res;
  }

  async findOne(data) {
    const item = await db.tanqueos.findOne({ where: data });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async findAll(data) {
    const items = await db.tanqueos.findAll({ where: data });
    return items;
  }
  


  async update(id, changes) {
    const item = await db.tanqueos.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const result = await db.tanqueos.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.tanqueos.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.tanqueos.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async paginate(offset, limit, item) {
    // Validar entrada
    const newOffset = (parseInt(offset) - 1) * parseInt(limit);
    const newLimit = parseInt(limit);
    // Desestructurar item
    const { where: whereClause } = item;
    // Ejecutar consulta para obtener datos paginados y total en una sola llamada
    const { rows: result, count: total } = await db.tanqueos.findAndCountAll({
      where: whereClause,
      limit: newLimit,
      offset: newOffset
    });

    return { data: result, total };
  }


}

module.exports = tanqueosService
