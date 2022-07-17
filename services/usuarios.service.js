
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
    const existe = await db.almacenes_por_usuario.findOne({ where: { username: data.username, id_almacen: data.id_almacen } });
    if (existe) throw boom.conflict('El item ya existe')
    const newUser = await db.almacenes_por_usuario.create(data);
    return newUser;
  }

  async updateAlmacenFromUser(username, id_almacen) {
    const almacen = await db.almacenes_por_usuario.findAll({ where: { username, id_almacen } });
    if (!almacen) {
      throw boom.notFound('El item no existe')
    }
    const result = await db.almacenes_por_usuario.update({ habilitado: !almacen.habilitado }, { where: { username, id_almacen } });
    return result;
  }

  async findAllAlmacenesassigned() {
    return await db.almacenes_por_usuario.findAll();
  }

  async findByUser(username) {
    const almacenes = await db.almacenes_por_usuario.findAll({ where: { username } });
    return almacenes;
  }

  async findAlmacenByUser(username, id_almacen) {
    const almacenes = await db.almacenes_por_usuario.findOne({ where: { username, id_almacen } });
    return almacenes;
  }

  async deleteAlmacenFromUser(username, id_almacen) {
    const index = await db.almacenes_por_usuario.destroy({ where: { username, id_almacen } });
    if (!index) throw boom.notFound('El item no existe');
    return { message: "El item fue eliminado", index };
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
