
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models');

const emailService = require('./email.service');
const serviceEmail = new emailService()


class HistorialMovimientosService {

  constructor() { }

  async create(data) {
    if ((data.cantidad > 20) && data.cons_lista_movimientos == 'AJ') {
      await serviceEmail.send('hmeneses@banarica.com, ydavila@banarica.com, practicantesantamarta@banarica.com, mhernandezp@banarica.com',
        `Alerta de Ajuste - ${data.cons_movimiento} - ${new Date().getTime()}`,
        `<h3>Ajuste <b>${data.cons_movimiento}</b></h3>
        <p>
        El almacén <b>${data.cons_almacen_gestor}</b> ha realizado un ajuste mayor a 20 unidades en el artículo con código <b>${data.cons_producto}</b> 
        </p>`)
    }
    await db.historial_movimientos.create(data)
    return data
  }

  async find() {
    return await db.historial_movimientos.findAll({ include: ['Producto', 'movimiento'] });
  }

  async findOne(consecutivo) {
    const items = await db.historial_movimientos.findAll({
      where: { cons_movimiento: consecutivo },
      include: ['Producto', 'movimiento']
    })
    if (items == 0) throw boom.notFound('El item no existe')
    return items;
  }


  async filter(body) {
    const items = await db.historial_movimientos.findAll({ 
      where: body, 
      include: [{ model: db.productos }, { model: db.movimientos }] 
    });
    return items;
  }

  async generalFilter(body) {
  body.producto = body.producto || {};
  body.producto.name = body.producto.name || "";
  body.producto.cons_categoria = body.producto.cons_categoria || "";

  const newlimit = parseInt(body.pagination.limit);
  const newoffset = (parseInt(body.pagination.offset) - 1) * newlimit;

  let whereClause = {
    cons_lista_movimientos: { [Op.ne]: ["TR"] },
    ...body.historial,
    '$Producto.name$': { [Op.like]: `%${body?.producto?.name}%` },
    '$Producto.cons_categoria$': { [Op.like]: `%${body?.producto?.cons_categoria}%` }
  };

  if (body?.movimiento) {
    whereClause.fecha = { [Op.like]: `%${body?.movimiento?.fecha}%` };
  }

  const queryOptions = {
    where: whereClause,
    include: [
      {
        model: db.productos,
        as: 'Producto',
        attributes: [],
        where: {},
      },
      'movimiento'
    ],
    limit: newlimit,
    offset: newoffset
  };

  if (body?.movimiento) {
    const moveList = await db.movimientos.findAll({ where: body.movimiento });
    const list = moveList.map(item => item.consecutivo);
    queryOptions.where.cons_movimiento = list;
  }

  const { count, rows: items } = await db.historial_movimientos.findAndCountAll(queryOptions);

  return { data: items, total: count };
}


  async update(id, changes) {
    const item = await db.historial_movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe')
    await item.update(changes)
    return item;
  }

  async delete(id) {
    const item = await db.historial_movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit, almacenes) {
    const newlimit = parseInt(limit);
    const newoffset = (parseInt(offset) - 1) * newlimit;

    const { count, rows: data } = await db.historial_movimientos.findAndCountAll({
      where: {
        cons_almacen_gestor: { [Op.in]: almacenes },
        cons_lista_movimientos: { [Op.ne]: ["TR"] }
      },
      include: ['Producto', 'movimiento'],
      limit: newlimit,
      offset: newoffset
    });

    return { data, total: count };
  }
}

module.exports = HistorialMovimientosService
