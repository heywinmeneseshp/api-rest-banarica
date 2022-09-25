
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models');

class pedidosService {

  constructor() { }

  async create(data) {
    await db.pedidos.create(data);
    return data
  }

  async find() {
    return await db.pedidos.findAll({
      include: ["tabla", "producto", "almacen"]
    });
  }

  async findOne(consecutivo) {
    const items = await db.pedidos.findAll({ where: { cons_pedido: consecutivo } })
    if (items == 0) throw boom.notFound('El item no existe')
    return items
  }

  async update(id, changes) {
    const item = await db.pedidos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe')
    await item.update(changes)
    return item;
  }

  async delete(id) {
    const item = await db.pedidos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async findAllCons() {
    return await db.tabla_pedidos.findAll()
  }

  async findOneCons(consecutivo) {
    const item = await db.tabla_pedidos.findOne({
      where: { consecutivo: consecutivo },
      include: [{
        model: db.pedidos,
        as: "pedido",
        include: ["producto", {
          model: db.almacenes,
          as: "almacen"
        }]
      },
      {
        model: db.usuarios,
        as: "user"
      }]
    })
    return item;
  }

  async createCons(data) {
    const { count } = await db.tabla_pedidos.findAndCountAll();
    let consecutivo = "PD-" + count;
    const itemNuevo = { ...data, consecutivo };
    await db.tabla_pedidos.create(itemNuevo)
    return itemNuevo
  }

  async receiveOrder(id, changes) {
    const pedido = await db.tabla_pedidos.findOne({ where: { consecutivo: id } })
    if (!pedido) throw boom.notFound('El item no existe')
    await pedido.update(changes)
    return pedido
  }

  async deleteCons(id) {
    const item = await db.tabla_pedidos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit, almacen, cons_categoria, producto, semana) {
    if (!cons_categoria) cons_categoria = ""
    if (!producto) producto = ""
    if (!semana) semana = ""
    if (!offset || !limit) {
      return await db.pedidos.findAll({
        where: { cons_almacen_destino: almacen },
        include: [{
          model: db.tabla_pedidos,
          as: "tabla",
          where: { cons_semana: { [Op.like]: `%${semana}%` } }

        }, {
          model: db.productos,
          as: "producto",
          where: { name: { [Op.like]: `%${producto}%` }, cons_categoria: { [Op.like]: `%${cons_categoria}%` } }
        }, "almacen"]
      });
    } else {
      let newlimit = parseInt(limit);
      let newoffset = (parseInt(offset) - 1) * newlimit;
      const total = await db.pedidos.count({
        where: { cons_almacen_destino: almacen },
        limit: newlimit,
        offset: newoffset,
        include: [{
          model: db.tabla_pedidos,
          as: "tabla",
          where: { cons_semana: { [Op.like]: `%${semana}%` } }

        }, {
          model: db.productos,
          as: "producto",
          where: { name: { [Op.like]: `%${producto}%` }, cons_categoria: { [Op.like]: `%${cons_categoria}%` } }
        }, "almacen"]
      });
      const result = await db.pedidos.findAll({
        where: { cons_almacen_destino: almacen },
        limit: newlimit,
        offset: newoffset,
        include: [{
          model: db.tabla_pedidos,
          as: "tabla",
          where: { cons_semana: { [Op.like]: `%${semana}%` } }

        }, {
          model: db.productos,
          as: "producto",
          where: { name: { [Op.like]: `%${producto}%` }, cons_categoria: { [Op.like]: `%${cons_categoria}%` } }
        }, "almacen"]
      });
      return { data: result, total: total };
    }
  }
}

module.exports = pedidosService
