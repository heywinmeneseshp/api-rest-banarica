const boom = require('@hapi/boom');
const { generarIDProAndCat } = require('../middlewares/generarId.handler');

class ProductosService {

  constructor() {
    this.productos = [];
    this.generate();
  }

  generate() {
    this.productos.push({
      id: "TAP1",
      name: "Tapa OT 18kg",
      id_categoria: "C001",
      id_proveedor: "P001",
      salida_sin_stock: false,
      serial: false,
      permitirTraslados: false,
      costo: 1000,
      isBlock: false
    });

  }

  async create(data) {
    try {
      const isTheSame = (item) => (item.id).substring(0, 3) == (data.name).substring(0, 3).toUpperCase();
      const lista = this.productos.filter(isTheSame);
      let id = generarIDProAndCat(data.name, "xxx000")
      if (lista.length > 0) id = generarIDProAndCat(data.name, lista[lista.length - 1].id);
      const productoNuevo = {
        id: id,
        ...data
      };
      this.productos.push(productoNuevo)
      return productoNuevo
    } catch (error) {
      throw boom.badRequest(error)
    }
  }

  async find() {
    return this.productos
  }

  async findOne(id) {
    const producto = this.productos.find(item => item.id == id)
    if (!producto) {
      throw boom.notFound('El producto no existe')
    }
    return producto;
  }

  async update(id, changes) {
    const index = this.productos.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El producto no existe')
    }
    const producto = this.productos[index]
    this.productos[index] = {
      ...producto,
      ...changes
    };
    return this.productos[index];
  }

  async delete(id) {
    const index = this.productos.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El producto no existe')
    }
    this.productos.splice(index, 1); //Eliminar en la posicion X una candidad de Y productos
    return { message: "El producto fue eliminado", id, }

  }

}

module.exports = ProductosService
