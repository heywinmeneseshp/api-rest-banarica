const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class ubicacionesService {

  async create(data) {
    const payload = { ...data };
    delete payload.id;

    const where = [];
    if (payload.cod) {
      where.push({ cod: payload.cod });
    }
    if (payload.ubicacion) {
      where.push({ ubicacion: payload.ubicacion });
    }

    if (where.length > 0) {
      const existe = await db.ubicaciones.findOne({ where: { [Op.or]: where } });
      if (existe) throw boom.conflict('El item ya existe');
    }

    const newAlamacen = await db.ubicaciones.create(payload);
    return newAlamacen;
  }

  async find() {
    await db.ubicaciones.findOrCreate({
      where: { cod: 'PRE' }, defaults: {
        ubicacion: 'Predeterminado',
        detalle: 'N/A',
        activo: true,
        cod: 'PRE'
      }
    });
    const res = await db.ubicaciones.findAll();
    const ubicaciones = res.sort((a, b) => {
      if (a.dataValues.ubicacion == b.dataValues.ubicacion) {
        return 0;
      }
      if (a.dataValues.ubicacion < b.dataValues.ubicacion) {
        return -1;
      }
      return 1;
    });
    return ubicaciones;
  }

  async findOne(id) {
    const item = await db.ubicaciones.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async update(id, changes) {
    const item = await db.ubicaciones.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe');
    const result = await db.ubicaciones.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.ubicaciones.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.ubicaciones.destroy({ where: { id } });
    return { message: 'El item fue eliminado', id };
  }

  async paginate(offset, limit, item) {
    await db.ubicaciones.findOrCreate({
      where: { cod: 'PRE' }, defaults: {
        ubicacion: 'Predeterminado',
        detalle: 'N/A',
        activo: true,
        cod: 'PRE'
      }
    });
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.ubicaciones.count({
      where: { ubicacion: { [Op.like]: `%${item}%` } }
    });
    const result = await db.ubicaciones.findAll({
      where: { ubicacion: { [Op.like]: `%${item}%` } },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = ubicacionesService;
