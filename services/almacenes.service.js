
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models');

class AlmacenesService {

  async create(data) {
    const existe = await db.almacenes.findOne({ where: { consecutivo: data.consecutivo } });
    if (existe) throw boom.conflict('El almacen ya existe')
    const newAlamacen = await db.almacenes.create(data);
    return newAlamacen
  }

  async find() {
    const res = await db.almacenes.findAll()
    const almacenes = res.sort((a,b)=>{
      if (a.dataValues.nombre == b.dataValues.nombre) {
        return 0;
      }
      if (a.dataValues.nombre < b.dataValues.nombre) {
        return -1;
      }
      return 1;
    })
    return almacenes;
  }

  async findOne(consecutivo) {
    const almacen = await db.almacenes.findOne({ where: { consecutivo } });
    if (!almacen) throw boom.notFound('El almacen no existe')
    return almacen;
  }

  async update(consecutivo, changes) {
    const almacen = await db.almacenes.findOne({ where: { consecutivo } });
    if (!almacen) throw boom.notFound('El almacen no existe')
    const result = await db.almacenes.update(changes, { where: { consecutivo } });
    return result;
  }

  async delete(consecutivo) {
    const existe = await db.almacenes.findOne({ where: { consecutivo } });
    if (!existe) throw boom.notFound('El almacen no existe');
    await db.almacenes.destroy({ where: { consecutivo } });
    return { message: "El almacen fue eliminado", consecutivo }
  }

  async paginate(offset, limit, almacen) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.almacenes.count({
      where: { nombre: { [Op.like]: `%${almacen}%` } }
    });
    const result = await db.almacenes.findAll({
      where: { nombre: { [Op.like]: `%${almacen}%` } },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = AlmacenesService
