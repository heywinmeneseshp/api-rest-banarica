const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class vehiculoService {

  async create(data) {
    console.log(data)
    const existe = await db.vehiculo.findOne({ where: { id: data.id } });
    if (existe) throw boom.conflict('El item ya existe')
    const newAlamacen = await db.vehiculo.create(data);
    return newAlamacen
  }

  async find() {
    const vehiculo = await db.vehiculo.findAll()
    return vehiculo;
  }

  async findOne(id) {
    const item = await db.vehiculo.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const item = await db.vehiculo.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const result = await db.vehiculo.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.vehiculo.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.vehiculo.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async paginate(offset, limit, item) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.vehiculo.count({
      where: { placa: { [Op.like]: `%${item}%` } }
    });
    const result = await db.vehiculo.findAll({
      where: { placa: { [Op.like]: `%${item}%` } },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = vehiculoService
