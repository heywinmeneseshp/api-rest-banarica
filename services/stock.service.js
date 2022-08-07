
const boom = require('@hapi/boom');
const { date } = require('joi');
const db = require('../models');
const combosService = require('./combos.service');
const HistorialMovimientosService = require('./historialMovimientos.service');
const MovimientosService = require('./movimientos.service')

const serviceCombo = new combosService();
const serviceHistorial = new HistorialMovimientosService();
const serviceMovimiento = new MovimientosService();

class StockServices {

  constructor() {
    this.array = []
   }

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
    const suma = parseFloat(item[0].cantidad) + parseFloat(body.cantidad);
    await db.stock.update({ cantidad: suma }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    return { message: "El item fue actualizado", cantidad: suma };
  }

  async subtractAmounts(cons_almacen, cons_producto, body) {
    const item = await db.stock.findAll({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!item[0]) throw boom.notFound('El item no existe')
    const resta = parseFloat(item[0].cantidad) - parseFloat(body.cantidad);
    await db.stock.update({ cantidad: resta }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    return { message: "El item fue actualizado", cantidad: resta };
  }

  async exportCombo(body) {
    const productos = await db.productos.findAll()
    const almacen = body.cons_almacen;
    const comboList = body.comboList;
    const movimiento = {
      prefijo: "EX", pendiente: false, cons_semana: body.cons_semana, fecha: body.fecha, observaciones: body.observaciones
    }
    let movimientoR;
    await serviceMovimiento.create(movimiento).then(res => {
      movimientoR = res
    });
    comboList.forEach(async element => {
      await serviceCombo.findOneCombo(element.cons_combo).then(res => {
        res.forEach(async producto => {
          const consProducto = producto.dataValues.cons_producto
          const cantidad = parseFloat(element.cantidad)
          await this.subtractAmounts(almacen, consProducto, { cantidad: cantidad });
          const historial = {
            cons_movimiento: movimientoR.consecutivo,
            cons_producto: consProducto,
            cons_almacen_gestor: almacen,
            cons_lista_movimientos: "EX",
            tipo_movimiento: "Salida",
            razon_movimiento: "Exportacion",
            cantidad: cantidad,
          }
          await serviceHistorial.create(historial)
        })
      })
    })
    const result = {
      cons_almacen: almacen,
      tipo_movimiento: "Salida",
      razon_movimiento: "Exportacion",
      movimiento: movimientoR
    }

    return result
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
