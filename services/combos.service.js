const boom = require('@hapi/boom');
const { generarIDProAndCat } = require('../middlewares/generarId.handler');

class combosService {

  constructor() {
    this.listaItems = [];
    this.listaCombos = [];
    this.generate();
  }

  generate() {
    this.listaItems.push({
      id: "OTK1",
      nombre: "Onkel Tuka 18Kg",
      isBlock: false
    });
  }

  async create(data) {
    try {
      const isTheSame = (item) => (item.id).substring(0, 3) == (data.nombre).substring(0, 3).toUpperCase();
      const lista = this.listaItems.filter(isTheSame);
      let id = generarIDProAndCat(data.nombre, "xxx000")
      if (lista.length > 0) id = generarIDProAndCat(data.nombre, lista[lista.length - 1].id);
      const nuevoCombo = {
        id: id,
        ...data
      };
      this.listaItems.push(nuevoCombo)
      return nuevoCombo
    } catch (error) {
      throw boom.badRequest(error)
    }
  }

  async armarCombo(id_combo, id_producto) {
    try {
      const data = {
        id_combo: id_combo,
        id_producto: id_producto
      }
      this.listaCombos.push(data)
      return data

    } catch (error) {
      throw boom.badRequest(error)
    }
  }

  async find() {
    return this.listaItems
  }

  async findOneCombo(id_combo) {
    const array = this.listaCombos.filter(item => id_combo == item.id_combo)
    return array
  }

  async findAllCombos() {
    return this.listaCombos;
  }

  async findOne(id) {
    const combo = this.listaItems.find(item => item.id == id)
    if (!combo) {
      throw boom.notFound('El combo no existe')
    }
    return combo;
  }

  async update(id, changes) {
    const index = this.listaItems.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El combo no existe')
    }
    const combo = this.listaItems[index]
    this.listaItems[index] = {
      ...combo,
      ...changes
    };
    return this.listaItems[index];
  }

  async delete(id) {
    //Eliminar combos
    const index = this.listaItems.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El combo no existe')
    }
    this.listaItems.splice(index, 1); //Eliminar en la posicion X una candidad de Y listaItems
    //Eliminar productos del combo
    return { message: "El combo fue eliminado", id, }
  }

  async deleteAllWith(id) {
    const lista = this.listaCombos.filter((item) => id != item.id_combo);
    this.listaCombos = lista
  }

}

module.exports = combosService
