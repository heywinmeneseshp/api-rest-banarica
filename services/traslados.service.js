
const boom = require('@hapi/boom');
const getDate = require('../middlewares/getDate.handler')
const db = require('../models');

class RecepcionService {

  constructor() {
  }

  async create(data) {
    const { count } = await db.traslados.findAndCountAll();
    const consecutivo = "TR-" + count;
    const itemNuevo = { consecutivo, ...data }
    await db.traslados.create(itemNuevo);
    return itemNuevo
  }

  async find() {
    return await db.traslados.findAll();
  }

  async findOne(consecutivo) {
    const item = await db.traslados.findOne({ where: { consecutivo: consecutivo } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.update(changes)
    return traslados
  }

  async delete(id) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset)-1 )* newlimit;
    const result = await db.traslados.findAll({
    limit: newlimit,
    offset: newoffset
    });
    return result;
  }

}

module.exports = RecepcionService
