
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");

class ConductoresService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id: "CO-0",
      conductor: "Ramiro Perez",
      id_transportadora: "TR-1",
      email: "heywin1@gmail.com",
      tel: "3226737763",
      isBlock: false
    });
  }

  async create(data) {
    const ultimoItem = this.items[this.items.length-1]
    let id = "CO-0"
    if (ultimoItem) {
      id = generarID("CO", ultimoItem.id);
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

module.exports = ConductoresService
