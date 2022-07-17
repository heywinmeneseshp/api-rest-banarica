
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const getDate = require('../middlewares/getDate.handler');
const db = require('../models');

class pedidosService {

  constructor() {
    this.tabla_pedidos = [];
    this.tabla = [];
    this.generate();
  }

  generate() {
    this.tabla_pedidos.push({
      id: "PD-0",
      pendiente: true,
      observaciones: "observaciones.required()",
      fecha: getDate(),
      semana: "S2-22",
      usuario: "heywinmeneses"
    })
    this.tabla.push({
      id_pedido: "PD-0",
      id_producto: "CAT-0",
      id_almacen_destino: "302",
      cantidad: 300
    });
  }

  async create(data) {
    await db.pedidos.create(data);
    return data
  }

  async find() {
    return await db.pedidos.findAll();
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
    const item = await db.tabla_pedidos.findOne({ where: { consecutivo: consecutivo } })
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async createCons(data) {
    const { count } = await db.tabla_pedidos.findAndCountAll();
    let consecutivo = "PD-" + count;
    console.log(data)
    const itemNuevo = { ...data, consecutivo };
    await db.tabla_pedidos.create(itemNuevo)
    return itemNuevo
  }

  async receiveOrder(id, changes) {
    const pedido = await db.tabla_pedidos.findByPk(id)
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

  async paginate(offset, limit) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset)-1 )* newlimit;
    const result = await db.tabla_pedidos.findAll({
    limit: newlimit,
    offset: newoffset
    });
    return result;
  }
}

module.exports = pedidosService
