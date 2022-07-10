
const boom = require('@hapi/boom');

class UsuariosService {

  constructor() {
    this.almacenPorUsuario = [];
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      username: "username",
      nombre: "nombre",
      apellido: "apellido",
      email: "email",
      password: "password",
      tel: "tel",
      id_rol: "id_rol",
      isBlock: true
    });
    this.almacenPorUsuario.push({
      username: "username",
      id_almacen: "id_almacen",
      isBlock: true
    });
  }

  async create(data) {
    if (this.items.find(item => item.username == data.username)) {
      throw boom.conflict('El usuario ya existe')
    }
    this.items.push(data)
    return data
  }

  async find() {
    return this.items
  }

  async findOne(username) {
    const item = this.items.find(item => item.username == username)
    if (!item) {
      throw boom.notFound('El item no existe')
    }
    return item;
  }

  async update(username, changes) {
    const index = this.items.findIndex(item => item.username == username);
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

  async delete(username) {
    console.log(username)
    const index = this.items.findIndex(item => item.username == username);
    if (index === -1) {
      throw boom.notFound('El item no existe')
    }
    this.items.splice(index, 1); //Eliminar en la posicion X una candidad de Y items
    return { message: "El item fue eliminado", username, }
  }

  async addAlmacenToUser(data) {
    const existe = this.almacenPorUsuario.filter(item => item.username == data.username && item.id_almacen == data.id_almacen);
    if (existe.length > 0) {
      throw boom.conflict('El almacen ' + data.id_almacen + ' ya esta asignado al usuario ' + data.username);
    }
    this.almacenPorUsuario.push(data);
    return data;
  }

  async updateAlmacenFromUser(username, id_almacen) {
    const index = this.almacenPorUsuario.findIndex(almacen => almacen.username == username && almacen.id_almacen == id_almacen);
    if (index === -1) {
      throw boom.notFound('El almacen no esta asignado al usuario ' + username);
    }
    const almacen = this.almacenPorUsuario[index]
    const boolean = !almacen.isBlock;
    this.almacenPorUsuario[index] = {
      ...almacen,
      isBlock: boolean
    };
    return this.almacenPorUsuario[index];
  }

  async findAllAlmacenesassigned() {
    return this.almacenPorUsuario
  }

  async findByUser(username) {
    const almacenes = this.almacenPorUsuario.filter(almacen => almacen.username == username)
    return almacenes;
  }

  async findAlmacenByUser(username, id_almacen) {
    const almacenes = this.almacenPorUsuario.filter(almacen => almacen.username == username && almacen.id_almacen == id_almacen);
    return almacenes;
  }

  async deleteAlmacenFromUser(username, id_almacen) {
    const index = this.almacenPorUsuario.findIndex(almacen => almacen.username == username && almacen.id_almacen == id_almacen);
    if (index === -1) {
      throw boom.notFound('El almacen ' + id_almacen + 'no esta asignado al usuario ' + username);
    }
    this.almacenPorUsuario.splice(index, 1); //Eliminar en la posicion X una candidad de Y items
    return { message: "El almacen " + id_almacen + " fue eliminado para el usuario " + username }
  }

}

module.exports = UsuariosService
