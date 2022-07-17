
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const getDate = require('../middlewares/getDate.handler')
const db = require('../models');



class MovimientosService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id: "MV-0",
      pendiente: true,
      observaciones: "Lorem",
      id_semana: "S21-22",
      fecha: getDate()
    });
  }

  async create(data) {
    const { count } = await db.movimientos.findAndCountAll()
    let consecutivo = data.prefijo + "-" + count
    const itemNuevo = {
      consecutivo,
      pendiente: data.pendiente,
      observaciones: data.observaciones,
      cons_semana: data.cons_semana,
      fecha: getDate()
    }
    await db.movimientos.create(itemNuevo);
    return itemNuevo
  }

  async find() {
    return await db.movimientos.findAll()
  }

  async findOne(consecutivo) {
    const item = await db.movimientos.findOne({ where: { consecutivo: consecutivo } })
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async update(id, changes) {
    const item = await db.movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe')
    await item.update(changes)
    return item;
  }

  async delete(id) {
    const item = await db.movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" }
  }

  async paginate(offset, limit) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset)-1 )* newlimit;
    const result = await db.movimientos.findAll({
    limit: newlimit,
    offset: newoffset
    });
    return result;
  }

}

module.exports = MovimientosService
