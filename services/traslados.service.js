
const boom = require('@hapi/boom');
const bodyParser = require('body-parser');
const { Op } = require("sequelize");
const db = require('../models');

class RecepcionService {

  constructor() {
  }

  async create(data) {
    const { count } = await db.traslados.findAndCountAll();
    const consecutivo = "TR-" + count;
    const itemNuevo = { consecutivo, ...data }
    const res = await db.traslados.create(itemNuevo);
    return res
  }

  async find() {
    return await db.traslados.findAll();
  }

  async findOne(consecutivo) {
    const items = await db.historial_movimientos.findAll({
      where: { cons_movimiento: consecutivo },
      include: ['Producto', 'traslado']
    })
    return items;
  }

  async filter(body) {
    const producto = body?.producto?.name || ""
    const categoria = body?.producto?.cons_categoria || ""
    const semana = body?.semana || ""
    console.log(semana, "--------")
    if (body?.pagination) {
      let newlimit = parseInt(body.pagination.limit);
      let newoffset = (parseInt(body.pagination.offset) - 1) * newlimit;
      const total = await db.historial_movimientos.count({
        where: {
          [Op.or]: [{ cons_almacen_gestor: { [Op.in]: body.almacenes } }, { cons_almacen_receptor: { [Op.in]: body.almacenes } }],
          cons_lista_movimientos: { [Op.in]: ["TR"] }
        },
        include: [{
          model: db.productos,
          as: "Producto",
          where: { name: { [Op.like]: `%${producto}%` }, cons_categoria: { [Op.like]: `%${categoria}%` } }
        }, {
          model: db.traslados,
          as: "traslado",
          where: { semana: { [Op.like]: `%${semana}%` } }
        }]
      });
      const result = await db.historial_movimientos.findAll({
        where: {
          [Op.or]: [{ cons_almacen_gestor: { [Op.in]: body.almacenes } }, { cons_almacen_receptor: { [Op.in]: body.almacenes } }],
          cons_lista_movimientos: { [Op.in]: ["TR"] }
        },
        include: [{
          model: db.productos,
          as: "Producto",
          where: { name: { [Op.like]: `%${producto}%` }, cons_categoria: { [Op.like]: `%${categoria}%` } }
        }, {
          model: db.traslados,
          as: "traslado",
          where: { semana: { [Op.like]: `%${semana}%` } }
        }],
        limit: newlimit,
        offset: newoffset
      });
      return { data: result, total: total };
    } else {
      const result = await db.historial_movimientos.findAll({
        where: {
          [Op.or]: [{ cons_almacen_gestor: { [Op.in]: body.almacenes } }, { cons_almacen_receptor: { [Op.in]: body.almacenes } }],
          cons_lista_movimientos: { [Op.in]: ["TR"] }
        },
        include: [{
          model: db.productos,
          as: "Producto",
          where: { name: { [Op.like]: `%${producto}%` }, cons_categoria: { [Op.like]: `%${categoria}%` } }
        }, {
          model: db.traslados,
          as: "traslado",
          where: { semana: { [Op.like]: `%${semana}%` } }
        }]
      });
      return result
    }
  }

  async update(id, changes) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.update(changes)
    return traslados
  }

  async delete(id) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit, almacenes) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.historial_movimientos.count({
      where: {
        [Op.or]: [{ cons_almacen_gestor: { [Op.in]: almacenes } }, { cons_almacen_receptor: { [Op.in]: almacenes } }],
        cons_lista_movimientos: { [Op.in]: ["TR"] }
      }
    });
    const result = await db.historial_movimientos.findAll({
      where: {
        [Op.or]: [{ cons_almacen_gestor: { [Op.in]: almacenes } }, { cons_almacen_receptor: { [Op.in]: almacenes } }],
        cons_lista_movimientos: { [Op.in]: ["TR"] }
      },
      include: ['Producto', 'traslado'],
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }
}

module.exports = RecepcionService
