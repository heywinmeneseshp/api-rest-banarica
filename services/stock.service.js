
const boom = require('@hapi/boom');
const db = require('../models');
const { Op } = require('sequelize');
const HistorialMovimientosService = require('./historialMovimientos.service');
const MovimientosService = require('./movimientos.service');
const emailService = require('./email.service');
const serviceHistorial = new HistorialMovimientosService();
const serviceMovimiento = new MovimientosService();
const serviceEmail = new emailService();

class StockServices {

  constructor() { }

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

  async generalFilter(body) {
    if (body?.pagination) {
      let newlimit = parseInt(body.pagination.limit);
      let newoffset = (parseInt(body.pagination.offset) - 1) * newlimit;
      const data = await db.stock.findAll({
        where: { ...body.stock },
        include: [{
          model: db.productos,
          as: "producto",
          where: {
            cons_categoria: { [Op.like]: `%${body.producto.cons_categoria}%` },
            name: { [Op.like]: body?.producto?.name ? `%${body?.producto?.name}%` : `%%` },
            consecutivo: { [Op.like]: body?.producto?.consecutivo ? `%${body?.producto?.consecutivo}%` : `%%` }
          }
        }, {
          model: db.almacenes,
          as: "almacen",
          where: body.almacen
        }],
        offset: newoffset,
        limit: newlimit
      });
      const total = await db.stock.count({
        where: { ...body.stock },
        include: [{
          model: db.productos,
          as: "producto",
          where: {
            cons_categoria: { [Op.like]: `%${body.producto.cons_categoria}%` },
            name: { [Op.like]: body?.producto?.name ? `%${body?.producto?.name}%` : `%%` },
            consecutivo: { [Op.like]: body?.producto?.consecutivo ? `%${body?.producto?.consecutivo}%` : `%%` }
          }
        }, {
          model: db.almacenes,
          as: "almacen",
          where: body.almacen
        }]
      });
      return { data: data, total: total };
    } else {
      const data = await db.stock.findAll({
        where: body.stock, include: ['almacen', {
          model: db.productos,
          as: "producto",
          where: {
            cons_categoria: { [Op.like]: `%${body.producto.cons_categoria}%` },
            name: { [Op.like]: body?.producto?.name ? `%${body?.producto?.name}%` : `%%` },
            consecutivo: { [Op.like]: body?.producto?.consecutivo ? `%${body?.producto?.consecutivo}%` : `%%` }
          }
        }, {
            model: db.almacenes,
            as: "almacen",
            where: body.almacen
          }]
      });
      return data;
    }
  }

  async find() {
    return await db.stock.findAll({ include: ['almacen', 'producto'] });
  }

  async update(cons_almacen, cons_producto, changes) {
    const updatedItem = await db.stock.update(changes, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (updatedItem == 0) throw boom.conflict('El item no existe')
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
    if (!item[0]) {
      await db.stock.findOrCreate({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto, cantidad: body.cantidad, isBlock: false } });
      return item[0];
    } else {
      const suma = parseFloat(item[0].cantidad) + parseFloat(body.cantidad);
      await db.stock.update({ cantidad: suma }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
      const data = { cons_producto: cons_producto, cantidad: suma }

      if (cons_producto == "BAS3" && suma < 11) {
        if (item[0]?.aviso == null || item[0]?.aviso == 1) {
          await serviceEmail.send('hmeneses@banarica.com, jtaite@banarica.com',
            `Alerta Precintos - ${cons_almacen} ${new Date().getTime()}`,
            `<h3>Almacén <b>${cons_almacen}</b></h3>
          <p>
           Cantidad de precintos plásticos inferior a 11 unidades en el almacén <b>${cons_almacen}</b>
         </p>`)
          await db.stock.update({ aviso: 0 }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
        }
      } 
  
      if (cons_producto == "PRE33" && suma >= 11) {
        if (item[0]?.aviso == null || item[0]?.aviso == 0) {
          await db.stock.update({ aviso: 1 }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
        }
      } 

      return { message: "El item fue actualizado", data: data };
    }
  }

  async subtractAmounts(cons_almacen, cons_producto, body) {
    const item = await db.stock.findAll({ where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (!item[0]) throw boom.notFound('El item no existe')
    const resta = parseFloat(item[0].cantidad) - parseFloat(body.cantidad);
    await db.stock.update({ cantidad: resta }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    const data = { cons_producto: cons_producto, cantidad: resta }

    if (cons_producto == "BAS3" && resta < 11) {
      if (item[0]?.aviso == null || item[0]?.aviso == 1) {
        await serviceEmail.send('hmeneses@banarica.com, jtaite@banarica.com',
          `Alerta Precintos - ${cons_almacen}  ${new Date().getTime()}`,
          `<h3>Almacén <b>${cons_almacen}</b></h3>
        <p>
         Cantidad de precintos plásticos inferior a 11 unidades en el almacén <b>${cons_almacen}</b>
       </p>`)
        await db.stock.update({ aviso: 0 }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
      }
    } 

    if (cons_producto == "PRE33" && resta >= 11) {
      if (item[0]?.aviso == null || item[0]?.aviso == 0) {
        await db.stock.update({ aviso: 1 }, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
      }
    } 

    return { message: "El item fue actualizado", data: data };
  }

  async exportCombo(body) {
    const almacen = body.cons_almacen;
    const comboList = body.comboList;
    const movimiento = {
      prefijo: "EX", pendiente: false,
      cons_semana: body.cons_semana,
      fecha: body.fecha,
      realizado_por: body.realizado_por,
      aprobado_por: body.aprobado_por,
      observaciones: body.observaciones,
      vehiculo: body?.vehiculo
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
      await serviceHistorial.create(historial)
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
    return { data: result, total: total };
  }
}



module.exports = StockServices
