
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");

class NotificacionesService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id: "NT-0",
      id_almacen: "AL-1",
      id_movimiento: "MO-1",
      aprovado: false,
      visto: false,
    });
  }

  async create(data) {
    const ultimoItem = this.items[this.items.length-1]
    let id = "NT-0"
    if (ultimoItem) {
      id = generarID("NT", ultimoItem.id);
    }
    const itemNuevo = {
      id: id,
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

}

module.exports = NotificacionesService
