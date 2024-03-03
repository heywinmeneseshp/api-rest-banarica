
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models');

class categoria_vehiculosService {

  async create(data) {
    const existe = await db.categoria_vehiculos.findOne({ where: { id: data.id } });
    if (existe) throw boom.conflict('El item ya existe')
    const newAlamacen = await db.categoria_vehiculos.create(data);
    return newAlamacen
  }

  async find() {
    const res = await db.categoria_vehiculos.findAll()
    const categoria_vehiculos = res.sort((a,b)=>{
      if (a.dataValues.nombre == b.dataValues.nombre) {
        return 0;
      }
      if (a.dataValues.nombre < b.dataValues.nombre) {
        return -1;
      }
      return 1;
    })
    return categoria_vehiculos;
  }

  async findOne(id) {
    const item = await db.categoria_vehiculos.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const item = await db.categoria_vehiculos.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const result = await db.categoria_vehiculos.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.categoria_vehiculos.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.categoria_vehiculos.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async paginate(offset, limit, item) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.categoria_vehiculos.count({
      where: { nombre: { [Op.like]: `%${item}%` } }
    });
    const result = await db.categoria_vehiculos.findAll({
      where: { nombre: { [Op.like]: `%${item}%` } },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = categoria_vehiculosService