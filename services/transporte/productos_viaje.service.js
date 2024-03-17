
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class productos_viajesService {

  async create(data) {
    const newAlamacen = await db.productos_viajes.create(data);
    return newAlamacen
  }

  async find() {
    const res = await db.productos_viajes.findAll()
    const productos_viajes = res.sort((a,b)=>{
      if (a.dataValues.nombre == b.dataValues.nombre) {
        return 0;
      }
      if (a.dataValues.nombre < b.dataValues.nombre) {
        return -1;
      }
      return 1;
    })
    return productos_viajes;
  }

  async findOne(data) {
    const item = await db.productos_viajes.findOne({ where: data });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async findWhere(objeto) {
    const item = await db.rutas.findOne({ where: objeto });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const item = await db.productos_viajes.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const result = await db.productos_viajes.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.productos_viajes.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.productos_viajes.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async paginate(offset, limit, item) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.productos_viajes.count({
      where: { programacion_id: { [Op.like]: `%${item}%` } }
    });
    const result = await db.productos_viajes.findAll({
      where: { programacion_id: { [Op.like]: `%${item}%` } },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = productos_viajesService
