
const boom = require('@hapi/boom');
const { generarID } = require("../middlewares/generarId.handler");
const getDate = require('../middlewares/getDate.handler')



class MovimientosService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id: "MV-0",
      pendiente: true,
      observaciones: "Lorem",
      id_semana: "S21-22",
      fecha: getDate()
    });
  }

  async create(data) {
    const ultimoItem = this.items[this.items.length-1]
    let id = data.prefijo + "-0"
    if (ultimoItem) {
      id = generarID( data.prefijo, ultimoItem.id);
    }
    const itemNuevo = {
      id: id,
      pendiente: data.pendiente,
      observaciones: data.observaciones,
      id_semana: data.id_semana,
      fecha: getDate()
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

module.exports = MovimientosService
