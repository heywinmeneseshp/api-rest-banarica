
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
    const { pagination, stock = {}, producto = {}, almacen = {} } = body;
    const { includeZero, ...stockFilters } = stock;

    const stockWhere = {
      ...stockFilters,
      ...(includeZero ? {} : { cantidad: { [Op.ne]: 0 } })
    };

    const productoWhere = {
      cons_categoria: Array.isArray(producto.cons_categoria)
        ? { [Op.in]: producto.cons_categoria }
        : { [Op.like]: `%${producto.cons_categoria || ''}%` },
      name: { [Op.like]: producto.name ? `%${producto.name}%` : '%%' },
      consecutivo: Array.isArray(producto.consecutivo)
        ? { [Op.in]: producto.consecutivo }
        : { [Op.like]: producto.consecutivo ? `%${producto.consecutivo}%` : '%%' }
    };

    const almacenWhere = {
      ...almacen,
      consecutivo: Array.isArray(almacen?.consecutivo)
        ? { [Op.in]: almacen.consecutivo }
        : almacen?.consecutivo || { [Op.like]: '%%' }
    };

    const include = [
      {
        model: db.productos,
        as: "producto",
        where: productoWhere
      },
      {
        model: db.almacenes,
        as: "almacen",
        where: almacenWhere
      }
    ];

    if (pagination) {
      const limit = parseInt(pagination.limit, 10) || 10;
      const offset = ((parseInt(pagination.offset, 10) || 1) - 1) * limit;
      const [data, total] = await Promise.all([
        db.stock.findAll({
          where: stockWhere,
          include,
          limit,
          offset,
          order: [
            ['cons_almacen', 'ASC'],
            ['cons_producto', 'ASC']
          ]
        }),
        db.stock.count({
          where: stockWhere,
          include,
          distinct: true,
          col: 'id'
        })
      ]);
      return { data, total };
    }

    const data = await db.stock.findAll({
      where: stockWhere,
      include,
      order: [
        ['cons_almacen', 'ASC'],
        ['cons_producto', 'ASC']
      ]
    });
    return data;
  }


  async find() {
    return await db.stock.findAll({ include: ['almacen', 'producto'] });
  }

  async update(cons_almacen, cons_producto, changes) {
    const updatedItem = await db.stock.update(changes, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (updatedItem[0] == 0) throw boom.conflict('El item no existe')
    return changes;
  }

  async findOneAlmacen(cons_almacen) {
    return await db.stock.findAll({ where: { cons_almacen: cons_almacen }, include: ['almacen', 'producto'] });
  }

  async findOneProductInAll(cons_producto) {
    return await db.stock.findAll({ where: { cons_producto: cons_producto }, include: ['almacen', 'producto'] });
  }

  async addAmounts(cons_almacen, cons_producto, body, transaction = null) {
    let t;
    try {
      if (!transaction) {
        t = await db.sequelize.transaction();
      } else {
        t = transaction;
      }

      const items = await db.stock.findAll({
        where: { cons_almacen, cons_producto },
        transaction: t
      });

      if (!items[0]) {
        await db.stock.findOrCreate({
          where: { cons_almacen, cons_producto, cantidad: body.cantidad, isBlock: false },
          transaction: t
        });

        if (!transaction) {
          await t.commit();
        }

        return items[0];
      } else {
        const suma = parseFloat(items[0].cantidad) + parseFloat(body.cantidad);
        await db.stock.update(
          { cantidad: suma },
          { where: { cons_almacen, cons_producto }, transaction: t }
        );

        const data = { cons_producto, cantidad: suma };

        await this.handlePre33Alert(cons_almacen, cons_producto, suma, items[0], t);

        if (!transaction) {
          await t.commit();
        }

        return { message: "El item fue actualizado", data };
      }

    } catch (error) {
      if (t) {
        await t.rollback();
      }
      throw boom.badRequest(error.message || 'Error al actualizar el stock');
    }
  }

  async subtractAmounts(cons_almacen, cons_producto, body, transaction = null) {
    let t;
    try {
      t = transaction || await db.sequelize.transaction();
      console.log(`Buscando stock: ${cons_producto} en ${cons_almacen}, cantidad a restar: ${body.cantidad}`);

      const item = await db.stock.findOne({
        where: {
          cons_almacen: cons_almacen,
          cons_producto: cons_producto
        },
        transaction: t
      });

      let nuevaCantidad;

      if (!item) {
        console.log(`Producto ${cons_producto} no encontrado en almacen ${cons_almacen}. Creando registro...`);

        await db.stock.create({
          cons_almacen: cons_almacen,
          cons_producto: cons_producto,
          cantidad: 0,
          no_disponible: 0,
          aviso: null,
          isBlock: false
        }, { transaction: t });

        console.log(`Registro creado para ${cons_producto} en ${cons_almacen}`);

        nuevaCantidad = 0 - parseFloat(body.cantidad);
      } else {
        nuevaCantidad = parseFloat(item.cantidad) - parseFloat(body.cantidad);
      }

      await db.stock.update(
        { cantidad: nuevaCantidad },
        { where: { cons_almacen: cons_almacen, cons_producto: cons_producto }, transaction: t }
      );

      const data = {
        cons_producto: cons_producto,
        cantidad: nuevaCantidad,
        cons_almacen: cons_almacen
      };

      console.log(`Stock actualizado: ${cons_producto} en ${cons_almacen}, nueva cantidad: ${nuevaCantidad}`);

      await this.handlePre33Alert(cons_almacen, cons_producto, nuevaCantidad, item, t);

      if (!transaction) {
        await t.commit();
      }

      return {
        message: item ? "El item fue actualizado" : "Registro creado y actualizado",
        data: data
      };

    } catch (error) {
      if (t && !transaction) {
        await t.rollback();
      }
      console.error('Error en subtractAmounts:', error);
      throw error;
    }
  }

  async handlePre33Alert(cons_almacen, cons_producto, nuevaCantidad, item, transaction) {
    if (cons_producto !== "PRE33") return;

    const itemActual = item || await db.stock.findOne({
      where: { cons_almacen, cons_producto },
      transaction
    });

    if (nuevaCantidad < 11) {
      if (itemActual?.aviso == null || itemActual?.aviso == 1) {
        console.log(`Alerta PRE33: Stock bajo en ${cons_almacen} (${nuevaCantidad} unidades)`);

        await serviceEmail.send(
          'hmeneses@banarica.com, jtaite@banarica.com',
          `Alerta Precintos - ${cons_almacen} ${new Date().getTime()}`,
          `<h3>Almacen <b>${cons_almacen}</b></h3>
          <p>Cantidad de precintos plasticos inferior a 11 unidades en el almacen <b>${cons_almacen}</b></p>
          <p>Cantidad actual: <b>${nuevaCantidad}</b> unidades</p>`
        );

        await db.stock.update(
          { aviso: 0 },
          { where: { cons_almacen, cons_producto }, transaction }
        );
      }
    } else if (nuevaCantidad >= 11) {
      if (itemActual?.aviso == null || itemActual?.aviso == 0) {
        await db.stock.update(
          { aviso: 1 },
          { where: { cons_almacen, cons_producto }, transaction }
        );
      }
    }
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
    };
    const movimientoR = await serviceMovimiento.create(movimiento);

    const comboCons = comboList.map(c => c.cons_combo);
    const tablaCombos = await db.tabla_combos.findAll({
      where: { cons_combo: { [Op.in]: comboCons } }
    });

    const comboQuantities = new Map(comboList.map(c => [c.cons_combo, c.cantidad]));

    const productMap = new Map();
    for (const tc of tablaCombos) {
      const qty = comboQuantities.get(tc.cons_combo);
      if (qty) {
        const key = tc.cons_producto;
        productMap.set(key, (productMap.get(key) || 0) + parseFloat(qty));
      }
    }

    for (const [cons_producto, cantidad] of productMap) {
      await this.subtractAmounts(almacen, cons_producto, { cantidad });
      const historial = {
        cons_movimiento: movimientoR.consecutivo,
        cons_producto,
        cons_almacen_gestor: almacen,
        cons_lista_movimientos: "EX",
        tipo_movimiento: "Salida",
        razon_movimiento: "Exportacion",
        cantidad,
      };
      await serviceHistorial.create(historial);
    }

    return {
      cons_almacen: almacen,
      tipo_movimiento: "Salida",
      razon_movimiento: "Exportacion",
      movimiento: movimientoR
    };
  }

  async deleteStock(cons_almacen, cons_producto) {
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
          [Op.in]: almacenesCons
        }
      },
      include: ['almacen', 'producto']
    });
    return { data: result, total: total };
  }
}

module.exports = StockServices
