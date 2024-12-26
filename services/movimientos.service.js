const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const getDate = require('../middlewares/getDate.handler');
const db = require('../models');
const emailService = require('./email.service');

const serviceEmail = new emailService();

class MovimientosService {

  constructor() { }

  async create(data, transaction = null) {
    let t;
    try {
      // Si no se proporciona una transacción, crea una nueva
      if (!transaction) {
        t = await db.sequelize.transaction();
      } else {
        t = transaction;
      }

      // Obtén el conteo actual de movimientos
      const { count } = await db.movimientos.findAndCountAll({ transaction: t });

      // Genera el consecutivo
      const consecutivo = `${data.prefijo}-${count}`;
      const itemNuevo = { consecutivo, ...data };
console.log(itemNuevo)
      // Crea un nuevo movimiento dentro de la transacción
      const item = await db.movimientos.create(itemNuevo, { transaction: t });

      // Enviar correo si el prefijo es "DV"
      if (data.prefijo === "DV") {
        await serviceEmail.send(
          'ydavila@banarica.com, practicantesantamarta@banarica.com',
          `Devolución ${consecutivo}`,
          `<h3>Devolución <b>${consecutivo}</b> pendiente por revisión</h3>
          <p><b>Observaciones:</b> ${item?.dataValues?.observaciones}</p>
          <p>Para ver el documento, haz 
          <a href="https://app-banarica.vercel.app/Documento/Movimiento/${consecutivo}">
            Clic Aquí
          </a></p>`
        );
      }

      // Si la transacción fue creada dentro de esta función, confírmala
      if (!transaction) {
        await t.commit();
      }

      return item;
    } catch (error) {
      // Rollback de la transacción en caso de error
      if (t) await t.rollback();
      
      // Maneja el error
      throw boom.badRequest(error.message || 'Error al crear el movimiento');
    }
  }

  async find() {
    return await db.movimientos.findAll();
  }

  async findDocument(body) {
    const [movimiento, historial, productos, almacenes] = await Promise.all([
      db.movimientos.findOne({ where: { consecutivo: body.consecutivo } }),
      db.historial_movimientos.findAll({ where: { cons_movimiento: body.consecutivo } }),
      db.productos.findAll(),
      db.almacenes.findAll()
    ]);

    const array = historial.map(item => {
      const { cantidad, cons_producto } = item.dataValues;
      const producto = productos.find(p => p.dataValues.consecutivo === cons_producto);

      if (producto) {
        return {
          cantidad,
          cons_producto: producto.dataValues.consecutivo,
          nombre: producto.dataValues.name
        };
      }
    }).filter(Boolean); // Remove any undefined items

    const consAlmacen = historial[0]?.dataValues.cons_almacen_gestor;
    const almacen = almacenes.find(a => a.dataValues.consecutivo === consAlmacen)?.dataValues.nombre;

    return {
      cons_almacen: consAlmacen,
      almacen,
      movimiento: movimiento?.dataValues,
      tipo_movimiento: historial[0]?.dataValues.tipo_movimiento,
      razon_movimiento: historial[0]?.dataValues.razon_movimiento,
      lista: array
    };
  }

  async findOne(consecutivo) {
    const item = await db.movimientos.findOne({
      where: { consecutivo },
      include: [
        { model: db.historial_movimientos, as: "historial_movimientos", include: [{ model: db.productos, as: "Producto" }] },
        { model: db.usuarios, as: "realizado" },
        { model: db.usuarios, as: "aprobado" }
      ]
    });
  
    if (!item) {
      throw boom.notFound('El item no existe');
    }
  
    return item;
  }

  async update(id, changes) {
    const item = await db.movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.update(changes);
    return item;
  }

  async delete(id) {
    const item = await db.movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy();
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit) {
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = (parseInt(offset, 10) - 1) * parsedLimit;

    return await db.movimientos.findAll({
      limit: parsedLimit,
      offset: parsedOffset
    });
  }
}

module.exports = MovimientosService;
