
const boom = require('@hapi/boom');
const db = require('../models');
const { Op } = require('sequelize');
const HistorialMovimientosService = require('./historialMovimientos.service');
const MovimientosService = require('./movimientos.service')
const serviceHistorial = new HistorialMovimientosService();
const serviceMovimiento = new MovimientosService();

class StockServices {

  constructor() {

  }

  async create(data) {
    const item = await db.stock.findOrCreate({ where: { cons_almacen: data.cons_almacen, cons_producto: data.cons_producto }, defaults: data });
    if (!item[1]) throw boom.conflict('El item ya existe')
    return item[0];
  }

  async filter(cons_almacen, cons_producto) {
    const item = await db.stock.findOne({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto }, include: ['almacen', 'producto'] });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async find() {
    return await db.stock.findAll({ include: ['almacen', 'producto'] });
  }

  async update(cons_almacen, cons_producto, changes) {
    const updatedItem = await db.stock.update(changes, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!updatedItem) throw boom.conflict('El item no existe')
    return changes;
  }

  async findOneAlmacen(cons_almacen) {
    return await db.stock.findAll({ where: { cons_almacen: cons_almacen }, include: ['almacen', 'producto'] });
  }

  async findOneProductInAll(cons_producto) {
    return await db.stock.findAll({ where: { cons_producto: cons_producto }, include: ['almacen', 'producto'] });
  }

  async addAmounts(cons_almacen, cons_producto, body) {
    const item = await db.stock.findAll({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!item[0]) throw boom.notFound('El item no existe')
    const suma = parseFloat(item[0].cantidad) + parseFloat(body.cantidad);
    await db.stock.update({ cantidad: suma }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    const data = { cons_producto: cons_producto, cantidad: suma }
    return { message: "El item fue actualizado", data: data };
  }

  async subtractAmounts(cons_almacen, cons_producto, body) {
    const item = await db.stock.findAll({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!item[0]) throw boom.notFound('El item no existe')
    const resta = parseFloat(item[0].cantidad) - parseFloat(body.cantidad);
    await db.stock.update({ cantidad: resta }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    const data = { cons_producto: cons_producto, cantidad: resta }
    return { message: "El item fue actualizado", data: data };
  }

  async exportCombo(body) {
    const almacen = body.cons_almacen;
    const comboList = body.comboList;
    const movimiento = {
      prefijo: "EX", pendiente: false, cons_semana: body.cons_semana, fecha: body.fecha, observaciones: body.observaciones
    }
    let movimientoR;
    await serviceMovimiento.create(movimiento).then(res => {
      movimientoR = res
    });
    const resultado = comboList.map(async element => {
      return await db.tabla_combos.findAll({ where: { cons_combo: element.cons_combo } });
    })
    const res = (await Promise.all(resultado)).flat()
    const resB = res.map(element => element.dataValues)
    const resC = resB.map(element => {
      const prodcutosByCant = comboList.map(element2 => {
        if (element.cons_combo === element2.cons_combo) {
          return { cons_producto: element.cons_producto, cantidad: element2.cantidad }
        }
      })
      return prodcutosByCant
    })
    const resD = resC.flat().filter(element => element !== undefined)
    let objeto = {};
    resD.forEach(element => {
      objeto[element.cons_producto] = parseFloat(element.cantidad) + parseFloat(objeto[element.cons_producto] || 0);
    })
    for (const key in objeto) {
      const number = parseFloat(objeto[key]);
      this.subtractAmounts(almacen, key, { cantidad: number })
      const historial = {
        cons_movimiento: movimientoR.consecutivo,
        cons_producto: key,
        cons_almacen_gestor: almacen,
        cons_lista_movimientos: "EX",
        tipo_movimiento: "Salida",
        razon_movimiento: "Exportacion",
        cantidad: objeto[key],
      }
      await serviceHistorial.create(historial).then(res => console.log(res))
    }
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

  async paginate(offset, limit, almacenes) {
    let almacenesCons = almacenes.map(almacen => almacen.consecutivo);
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.stock.count({ where: { cons_almacen: { [Op.in]: almacenesCons } } });
    const result = await db.stock.findAll({
      limit: newlimit,
      offset: newoffset,
      where: {
        cons_almacen: {
          [Op.or]: almacenesCons
        }
      },
      include: ['almacen', 'producto']
    });
    return {data: result, total: total};
  }
}



module.exports = StockServices
