
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
    const { pagination, stock = {}, producto = {}, almacen } = body;

    // Filtros comunes
    const stockWhere = {
      ...stock,
      cantidad: { [Op.ne]: 0 } // Solo stock diferente de cero, si quieres mantener esta condición
    };

    const productoWhere = {
      cons_categoria: { [Op.like]: `%${producto.cons_categoria || ''}%` },
      name: { [Op.like]: producto.name ? `%${producto.name}%` : '%%' },
      consecutivo: { [Op.like]: producto.consecutivo ? `%${producto.consecutivo}%` : '%%' }
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
        where: almacen
      }
    ];
    // Si hay paginación
    if (pagination) {
      const limit = parseInt(pagination.limit);
      const offset = (parseInt(pagination.offset) - 1) * limit;
      const [data, total] = await Promise.all([
        db.stock.findAll({
          where: stockWhere,
          include,
          limit,
          offset
        }),
        db.stock.count({
          where: stockWhere,
          include,
          distinct: true,
          col: 'id' // reemplaza con la PK de stock si no es 'id'
        })
      ]);
      return { data, total };
    }
    // Sin paginación
    const data = await db.stock.findAll({
      where: stockWhere,
      include
    });
    return data;
  }


  async find() {
    return await db.stock.findAll({ include: ['almacen', 'producto'] });
  }

  async update(cons_almacen, cons_producto, changes) {
    const updatedItem = await db.stock.update(changes, { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } });
    if (updatedItem == 0) throw boom.conflict('El item no existe')
      console.log(cons_almacen, cons_producto, changes, "heywinnnnnnnnnnnnnnnnnnnnnn")
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
      // Usa la transacción proporcionada o crea una nueva si no se proporciona
      if (!transaction) {
        t = await db.sequelize.transaction();
      } else {
        t = transaction;
      }

      // Obtén el registro del stock
      const items = await db.stock.findAll({
        where: { cons_almacen, cons_producto },
        transaction: t
      });

      if (!items[0]) {
        // Si no hay registros, crea uno nuevo
        await db.stock.findOrCreate({
          where: { cons_almacen, cons_producto, cantidad: body.cantidad, isBlock: false },
          transaction: t
        });

        // Si la transacción fue creada dentro de esta función, confírmala
        if (!transaction) {
          await t.commit();
        }

        return items[0];
      } else {
        // Si hay registros, actualiza la cantidad
        const suma = parseFloat(items[0].cantidad) + parseFloat(body.cantidad);
        await db.stock.update(
          { cantidad: suma },
          { where: { cons_almacen, cons_producto }, transaction: t }
        );

        const data = { cons_producto, cantidad: suma };

        // Verifica y envía alertas si es necesario
        if (cons_producto === "PRE33") {
          if (suma < 11) {
            if (items[0]?.aviso == null || items[0]?.aviso == 1) {
              await serviceEmail.send(
                'hmeneses@banarica.com, jtaite@banarica.com',
                `Alerta Precintos - ${cons_almacen} ${new Date().getTime()}`,
                `<h3>Almacén <b>${cons_almacen}</b></h3>
                <p>
                 Cantidad de precintos plásticos inferior a 11 unidades en el almacén <b>${cons_almacen}</b>
               </p>`
              );
              await db.stock.update(
                { aviso: 0 },
                { where: { cons_almacen, cons_producto }, transaction: t }
              );
            }
          } else if (suma >= 11) {
            if (items[0]?.aviso == null || items[0]?.aviso == 0) {
              await db.stock.update(
                { aviso: 1 },
                { where: { cons_almacen, cons_producto }, transaction: t }
              );
            }
          }
        }

        // Si la transacción fue creada dentro de esta función, confírmala
        if (!transaction) {
          await t.commit();
        }

        return { message: "El item fue actualizado", data };
      }

    } catch (error) {
      // Realiza un rollback si se creó una transacción
      if (t) {
        await t.rollback();
      }
      // Maneja el error
      throw boom.badRequest(error.message || 'Error al actualizar el stock');
    }
  }

  async subtractAmounts(cons_almacen, cons_producto, body) {
    try {
      console.log(`📦 Buscando stock: ${cons_producto} en ${cons_almacen}, cantidad a restar: ${body.cantidad}`);

      // Buscar el item
      const item = await db.stock.findOne({
        where: {
          cons_almacen: cons_almacen,
          cons_producto: cons_producto
        }
      });

      let nuevaCantidad;

      // Si no existe, crearlo con cantidad inicial 0
      if (!item) {
        console.log(`⚠️ Producto ${cons_producto} no encontrado en almacén ${cons_almacen}. Creando registro...`);

        // Crear registro con cantidad inicial 0
        await db.stock.create({
          cons_almacen: cons_almacen,
          cons_producto: cons_producto,
          cantidad: 0,
          no_disponible: 0,
          aviso: null,
          isBlock: false
        });

        console.log(`✅ Registro creado para ${cons_producto} en ${cons_almacen}`);

        // Como se creó con 0, la resta será negativa
        nuevaCantidad = 0 - parseFloat(body.cantidad);
      } else {
        // Si existe, calcular la nueva cantidad
        nuevaCantidad = parseFloat(item.cantidad) - parseFloat(body.cantidad);
      }

      // Actualizar la cantidad en la base de datos
      await db.stock.update(
        { cantidad: nuevaCantidad },
        { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } }
      );

      const data = {
        cons_producto: cons_producto,
        cantidad: nuevaCantidad,
        cons_almacen: cons_almacen
      };

      console.log(`✅ Stock actualizado: ${cons_producto} en ${cons_almacen}, nueva cantidad: ${nuevaCantidad}`);

      // Lógica específica para PRE33 (precintos)
      if (cons_producto == "PRE33") {
        // Si el item no existía, buscar el registro recién creado
        const itemActual = item || await db.stock.findOne({
          where: { cons_almacen: cons_almacen, cons_producto: cons_producto }
        });

        if (nuevaCantidad < 11) {
          if (itemActual?.aviso == null || itemActual?.aviso == 1) {
            console.log(`🚨 Alerta PRE33: Stock bajo en ${cons_almacen} (${nuevaCantidad} unidades)`);

            await serviceEmail.send(
              'hmeneses@banarica.com, jtaite@banarica.com',
              `Alerta Precintos - ${cons_almacen}  ${new Date().getTime()}`,
              `<h3>Almacén <b>${cons_almacen}</b></h3>
            <p>Cantidad de precintos plásticos inferior a 11 unidades en el almacén <b>${cons_almacen}</b></p>
            <p>Cantidad actual: <b>${nuevaCantidad}</b> unidades</p>`
            );

            await db.stock.update(
              { aviso: 0 },
              { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } }
            );
          }
        }

        if (nuevaCantidad >= 11) {
          if (itemActual?.aviso == null || itemActual?.aviso == 0) {
            await db.stock.update(
              { aviso: 1 },
              { where: { cons_almacen: cons_almacen, cons_producto: cons_producto } }
            );
          }
        }
      }

      return {
        message: item ? "El item fue actualizado" : "Registro creado y actualizado",
        data: data
      };

    } catch (error) {
      console.error('❌ Error en subtractAmounts:', error);
      throw error;
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
