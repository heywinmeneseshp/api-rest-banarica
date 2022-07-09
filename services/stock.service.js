
const boom = require('@hapi/boom');
const { date } = require('joi');

class DeudasService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id_almacen: "302",
      id_producto: "CAT-0",
      cantidad: 300,
      isBlock: false
    });
  }

  async createProductInStock(data) {
    const existe = this.items.filter((item) => item.id_almacen == data.id_almacen && item.id_producto == data.id_producto );
    if (existe.length > 0) throw boom.conflict('El item ya existe')
    const item = {
      ...data,
      cantidad: 0
    }
    this.items.push(data)
    return { message: "El item ha sido creado", data: data }
  }

  async filter(id_almacen, id_producto) {
    const result = this.items.filter((item) => item.id_almacen == id_almacen && item.id_producto == id_producto);
    return result
  }


  async find() {
    return this.items
  }

  async enableProductoAlmacen(id_producto, id_almacen) {
    const index = this.items.findIndex(item => item.id_almacen == id_almacen && item.id_producto == id_producto);
    if (index === -1) {
      throw boom.notFound('El item no existe')
    }
    const item = this.items[index]
    const isBlock = !item.isBlock
    this.items[index] = {
      ...item,
      isBlock: isBlock
    };
    return this.items[index];
  }

  async findOneAlmacen(id_almacen) {
    const item = this.items.find(item => item.id_almacen == id_almacen)
    if (!item) {
      throw boom.notFound('El item no existe')
    }
    return item;
  }

  async addAmounts(id_almacen, id_producto, cantidad) {
    const index = this.items.findIndex(item => item.id_almacen == id_almacen && item.id_producto == id_producto);
    if (index === -1) {
      throw boom.notFound('El item no existe')
    }
    const item = this.items[index]
    const nuevaCantidad = item.cantidad + cantidad
    this.items[index] = {
      ...item,
      cantidad: nuevaCantidad
    };
    return this.items[index];
  }

  async subtractAmounts(id_almacen, id_producto, cant) {
    const index = this.items.findIndex(item => item.id_almacen == id_almacen && item.id_producto == id_producto);
    if (index === -1) {
      throw boom.notFound('El item no existe')
    }
    const item = this.items[index]
    const nuevaCantidad = item.cantidad - cant
    this.items[index] = {
      ...item,
      cantidad: nuevaCantidad
    };
    return this.items[index];
  }

  async delete(id_almacen, id_producto) {
    const index = this.items.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El item no existe')
    }
    this.items.splice(index, 1); //Eliminar en la posicion X una candidad de Y items
    return { message: "El item fue eliminado", id, }
  }

}

module.exports = DeudasService
