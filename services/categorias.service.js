const boom = require('@hapi/boom');
const { generarIDProAndCat } = require('../middlewares/generarId.handler');

class CategoriasService {

  constructor() {
    this.categorias = [];
    this.generate();
  }

  generate() {
    this.categorias.push({
      id: "CAR1",
      nombre: "CARTON",
      isBlock: false
    });

  }

  async create(data) {
    try {
      const isTheSame = (item) => (item.id).substring(0, 3) == (data.nombre).substring(0, 3).toUpperCase();
      const lista = this.categorias.filter(isTheSame);
      let id = generarIDProAndCat(data.nombre, "xxx000")
      if (lista.length > 0) id = generarIDProAndCat(data.nombre, lista[lista.length - 1].id);
      const categoriaNuevo = {
        id: id,
        ...data
      };
      this.categorias.push(categoriaNuevo)
      return categoriaNuevo
    } catch (error) {
      throw boom.badRequest(error)
    }
  }

  async find() {
    return this.categorias
  }

  async findOne(id) {
    const categoria = this.categorias.find(item => item.id == id)
    if (!categoria) {
      throw boom.notFound('El categoria no existe')
    }
    return categoria;
  }

  async update(id, changes) {
    const index = this.categorias.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El categoria no existe')
    }
    const producto = this.categorias[index]
    this.categorias[index] = {
      ...producto,
      ...changes
    };
    return this.categorias[index];
  }

  async delete(id) {
    const index = this.categorias.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El categoria no existe')
    }
    this.categorias.splice(index, 1); //Eliminar en la posicion X una candidad de Y categorias
    return { message: "El categoria fue eliminado", id, }
  }

}

module.exports = CategoriasService
