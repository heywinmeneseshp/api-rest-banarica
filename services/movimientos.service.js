
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const getDate = require('../middlewares/getDate.handler')
const db = require('../models');

const emailService = require('./email.service');
const serviceEmail = new emailService()

class MovimientosService {

  constructor() { }


  async create(data) {
    const { count } = await db.movimientos.findAndCountAll()
    let consecutivo = data.prefijo + "-" + count
    const itemNuevo = {
      consecutivo,
      ...data
    }
    const item = await db.movimientos.create(itemNuevo);

    if (data.prefijo == "DV") {
      await serviceEmail.send('ydavila@banarica.com, practicantesantamarta@banarica.com',
        `Devolución ${consecutivo}`,
        `<h3>Devolucion <b>${consecutivo}</b> pendente por revisión</h3>
      <p>
        <b>Observaciones:</b> ${item?.dataValues?.observaciones}
      </p>
      <p>
       Para ver el documento hacer 
       <a href="https://app-banarica.vercel.app/Documento/Movimiento/${consecutivo}">
          Clic Aquí
        </a>
     </p>`,)
    }

    return item
  }


  async find() {
    return await db.movimientos.findAll()
  }

  async findDocument(body) {
    const [movimiento, historial, productos, almacenes] = await Promise.all([
      db.movimientos.findOne({ where: { consecutivo: body.consecutivo } }),
      db.historial_movimientos.findAll({ where: { cons_movimiento: body.consecutivo } }),
      db.productos.findAll(),
      db.almacenes.findAll()
    ]);

    const array = historial.map(item => {
      const cantidad = item.dataValues.cantidad;
      const consProducto = item.dataValues.cons_producto;
      const producto = productos.find(p => p.dataValues.consecutivo === consProducto);

      if (producto) {
        return {
          cantidad,
          cons_producto: producto.dataValues.consecutivo,
          nombre: producto.dataValues.name
        };
      }
    });

    const consAlmacen = historial[0]?.dataValues.cons_almacen_gestor;
    const almacen = almacenes.find(a => a.dataValues.consecutivo === consAlmacen)?.dataValues.nombre;

    const result = {
      cons_almacen: consAlmacen,
      almacen: almacen,
      movimiento: movimiento.dataValues,
      tipo_movimiento: historial[0]?.dataValues.tipo_movimiento,
      razon_movimiento: historial[0]?.dataValues.razon_movimiento,
      lista: array.filter(Boolean) // Remove any undefined items
    };

    return result;
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
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const result = await db.movimientos.findAll({
      limit: newlimit,
      offset: newoffset
    });
    return result;
  }

}

module.exports = MovimientosService
