
const boom = require('@hapi/boom');
const { date } = require('joi');
const db = require('../models');

class StockServices {

  constructor() { }


  async create(data) {
    const item = await db.stock.findOrCreate({ where: { cons_almacen: data.cons_almacen, cons_producto: data.cons_producto }, defaults: data });
    if (!item[1]) throw boom.conflict('El item ya existe')
    return item[0];
  }

  async filter(cons_almacen, cons_producto) {
    const item = await db.stock.findOne({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async find() {
    return await db.stock.findAll();
  }

  async update(cons_almacen, cons_producto, changes) {
    const updatedItem = await db.stock.update(changes, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!updatedItem) throw boom.conflict('El item no existe')
    return changes;
  }

  async findOneAlmacen(cons_almacen) {
    return await db.stock.findAll({ where: { cons_almacen: cons_almacen } });
  }

  async findOneProductInAll(cons_producto) {
    return await db.stock.findAll({ where: { cons_producto: cons_producto } });
  }

  async addAmounts(cons_almacen, cons_producto, body) {
    const item = await db.stock.findAll({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!item[0]) throw boom.notFound('El item no existe')
    const suma = item[0].cantidad + body.cantidad;
    await db.stock.update({ cantidad: suma }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    return { message: "El item fue actualizado", cantidad: suma };
  }

  async subtractAmounts(cons_almacen, cons_producto, body) {
    const item = await db.stock.findAll({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!item[0]) throw boom.notFound('El item no existe')
    const resta = item[0].cantidad - body.cantidad;
    await db.stock.update({ cantidad: resta }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    return { message: "El item fue actualizado", cantidad: resta };
  }

  async delete(cons_almacen, cons_producto) {
    const item = await db.stock.destroy({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!item) throw boom.notFound('El item no existe')
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit, const_almacen) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const result = await db.stock.findAll({
      where: {
        limit: newlimit,
        offset: newoffset
      }
    });
    return result;
  }

}

module.exports = StockServices
