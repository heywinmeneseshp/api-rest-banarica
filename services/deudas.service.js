
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");

class DeudasService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id: "DD-0",
      prestador: "302",
      deudor: "512",
      id_producto: "CA-01",
      cantidad: 22,
    });
  }

  async create(data) {
    const existe = this.items.filter((item) => item.prestador == data.prestador && item.deudor == data.deudor && item.id_producto == data.id_producto);
    if (existe.length > 0) throw boom.conflict('El item ya existe')
    const ultimoItem = this.items[this.items.length - 1]
    let id = "DD-0"
    if (ultimoItem) {
      id = generarID("DD", ultimoItem.id);
    }
    const itemNuevo = {
      id: id,
      ...data
    }
    this.items.push(itemNuevo)
    return itemNuevo
  }

  async filter(prestador, deudor) {
    const result = this.items.filter((item) => item.prestador == prestador && item.deudor == deudor);
    return result
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

module.exports = DeudasService
