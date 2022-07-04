
const boom = require('@hapi/boom');
const { generarIDSemana } = require("../middlewares/generarId.handler");

class SemanasService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id: "S1-22",
      semana: "22",
      anho: "2020"
    });
  }

  async create(data) {
    const id = generarIDSemana(data.semana, data.anho);
    const existe = this.items.find(item => item.id == id)
    if (existe) {
      throw boom.conflict('El item ya existe')
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

module.exports = SemanasService
