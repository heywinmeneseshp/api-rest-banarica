
const boom = require('@hapi/boom');

class AlmacenesService {

  constructor() {
    this.almacenes = [];
    this.generate();
  }

  generate() {
    this.almacenes.push({
      id: "300",
      nombre: "Almacen 1",
      razon_social: "Razon social 1",
      direccion: "Direccion 1",
      telefono: "Telefono 1",
      email: "Email 1",
      estado: true
    });
  }

  async create(data) {
    const almacen = this.almacenes.filter(item => item.id == data.id)
    if (almacen.length > 0) throw boom.conflict('El almacen ya existe')
    this.almacenes.push(data)
    return data
  }

  async find() {
    return this.almacenes
  }

  async findOne(id) {
    const almacen = this.almacenes.find(item => item.id == id)
    if (!almacen) {
      throw boom.notFound('El almacen no existe')
    }
    return almacen;
  }

  async update(id, changes) {
    const index = this.almacenes.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El almacen no existe')
    }
    const almacen = this.almacenes[index]
    this.almacenes[index] = {
      ...almacen,
      ...changes
    };
    return this.almacenes[index];
  }

  async delete(id) {
    const index = this.almacenes.findIndex(item => item.id == id);
    if (index === -1) {
      throw boom.notFound('El almacen no existe')
    }
    this.almacenes.splice(index, 1); //Eliminar en la posicion X una candidad de Y almacenes
    return { message: "El almacen fue eliminado", id }
  }

}

module.exports = AlmacenesService
