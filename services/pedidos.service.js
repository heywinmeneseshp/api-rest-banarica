
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const getDate = require('../middlewares/getDate.handler');

class PedidosService {

  constructor() {
    this.listaConsPedidos = [];
    this.items = [];
    this.generate();
  }

  generate() {
    this.listaConsPedidos.push({
      id: "PD-0",
      pendiente: true,
      observaciones: "observaciones.required()",
      fecha: getDate(),
      semana: "S2-22",
      usuario: "heywinmeneses"
    })
    this.items.push({
      id_pedido: "PD-0",
      id_producto: "CAT-0",
      id_almacen_destino: "302",
      cantidad: 300
    });
  }

  async create(data) {

    const itemNuevo = {
      ...data
    }
    this.items.push(itemNuevo)
    return itemNuevo
  }

  async find() {
    return this.items
  }

  async findOne(id) {
    const item = this.items.find(item => item.id == id)
    if (!item) {
      throw boom.notFound('El item no existe')
    }
    return item;
  }

  async update(id, changes) {
    const index = this.items.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El item no existe')
    }
    const item = this.items[index]
    this.items[index] = {
      ...item,
      ...changes
    };
    return this.items[index];
  }

  async delete(id) {
    const index = this.items.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El item no existe')
    }
    this.items.splice(index, 1); //Eliminar en la posicion X una candidad de Y items
    return { message: "El item fue eliminado", id, }
  }

  async findAllCons() {
    return this.listaConsPedidos
  }

  async findOneCons(id) {
    const item = this.listaConsPedidos.find(item => item.id == id)
    if (!item) {
      throw boom.notFound('El item no existe')
    }
    return item;
  }

  async createCons(data) {
    console.log(data)
    const existe = this.listaConsPedidos.filter((item) => item.id == data.id);
    if (existe.length > 0) throw boom.conflict('El pedido ya existe')
    const ultimoItem = this.listaConsPedidos[this.listaConsPedidos.length - 1]
    let id = "PD-0"
    if (ultimoItem) {
      id = generarID("PD", ultimoItem.id);
    }
    const itemNuevo = {
      id: id,
      ...data
    }
    this.listaConsPedidos.push(itemNuevo)
    return itemNuevo
  }

  async receiveOrder(id, changes) {
    const index = this.listaConsPedidos.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El item no existe')
    }
    const item = this.listaConsPedidos[index]
    this.listaConsPedidos[index] = {
      ...item,
      ...changes
    };
    return this.listaConsPedidos[index];
  }

  async deleteCons(id) {
    const index = this.listaConsPedidos.findIndex(item => item.id == id);
    console.log(index)
    if (index === -1) {
      throw boom.notFound('El item no existe')
    }
    this.listaConsPedidos.splice(index, 1); //Eliminar en la posicion X una candidad de Y items
    return { message: "El item fue eliminado", id, }
  }
}

module.exports = PedidosService
