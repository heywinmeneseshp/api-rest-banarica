
const boom = require('@hapi/boom');
const db = require('../models');


class UsuariosService {

  constructor() {
    this.almacenPorUsuario = [];
    this.generate();
  }

  generate() {
    this.almacenPorUsuario.push({
      username: "username",
      id_almacen: "id_almacen",
      isBlock: true
    });
  }

  async create(data) {
    const existe = await db.usuarios.findOne({ where: { username: data.username } });
    if (existe) throw boom.conflict('El usuarios ya existe')
    const newUser = await db.usuarios.create(data);
    return newUser
  }

  async find() {
    const result = await db.usuarios.findAll();
    return result;
  }

  async findOne(username) {
    try{
    const result = await db.usuarios.findOne({ where: { username } });
    return result;
    }catch(err){
      throw boom.notFound('El usuario no existe')
    }
  }

  async update(username, changes) {
    const user = await db.usuarios.findOne({ where: { username } });
    if (!user) {
      throw boom.notFound('El item no existe')
    }
    const result = await db.usuarios.update(changes, { where: { username } });
    return result;
  }

  async delete(username) {
    const result = await db.usuarios.destroy({ where: { username } });
    if (!result) throw boom.notFound('El usuario no existe');
    return { message: "El item fue eliminado", result };
  }

  async addAlmacenToUser(data) {
    const existe = this.almacenPorUsuarios.filter(item => item.username == data.username && item.id_almacen == data.id_almacen);
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

  async paginate(offset, limit) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset)-1 )* newlimit;
    const result = await db.usuarios.findAll({
    limit: newlimit,
    offset: newoffset
    });
    return result;
  }

}

module.exports = UsuariosService
