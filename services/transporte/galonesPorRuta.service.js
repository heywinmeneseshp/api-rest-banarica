
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class galones_por_rutaService {

  async create(data) {
    const existe = await db.galones_por_ruta.findOne({ where: { id: data.id } });
    if (existe) throw boom.conflict('El item ya existe')
    const newAlamacen = await db.galones_por_ruta.create(data);
    return newAlamacen
  }

  async find() {
    const res = await db.galones_por_ruta.findAll()
    const galones_por_ruta = res.sort((a,b)=>{
      if (a.dataValues.nombre == b.dataValues.nombre) {
        return 0;
      }
      if (a.dataValues.nombre < b.dataValues.nombre) {
        return -1;
      }
      return 1;
    })
    return galones_por_ruta;
  }

  async findOne(id) {
    const item = await db.galones_por_ruta.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const item = await db.galones_por_ruta.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const result = await db.galones_por_ruta.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.galones_por_ruta.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.galones_por_ruta.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async paginate(offset, limit, item) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.galones_por_ruta.count({
      where: { nombre: { [Op.like]: `%${item}%` } }
    });
    const result = await db.galones_por_ruta.findAll({
      where: { nombre: { [Op.like]: `%${item}%` } },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = galones_por_rutaService
