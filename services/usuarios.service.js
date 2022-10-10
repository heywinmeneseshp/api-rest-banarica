
const boom = require('@hapi/boom');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const db = require('../models');


class UsuariosService {

  constructor() { }

  async create(data) {
    const existe = await db.usuarios.findOne({ where: { username: data.username } });
    if (existe) throw boom.conflict('El usuarios ya existe')
    const password = await bcrypt.hash(data.password, 10);
    const user = { ...data, password: password };
    const newUser = await db.usuarios.create(user);
    delete newUser.dataValues.password;
    return newUser
  }

  async find() {
    const result = await db.usuarios.findAll();
    const lista = result.map(item => {
      delete item.dataValues.password
      delete item.dataValues.isBlock
      delete item.dataValues.createdAt
      delete item.dataValues.updatedAt
      delete item.dataValues.recovery_token
      delete item.dataValues.id
      return item.dataValues
    })
    return lista;
  }

  async findOne(username) {
    try {
      const result = await db.usuarios.findOne({ where: { username } });
      return result;
    } catch (err) {
      throw boom.notFound('El usuario no existe')
    }
  }

  async update(username, changes) {
    const user = await db.usuarios.findOne({ where: { username } });
    if (!user) {
      throw boom.notFound('El item no existe')
    }
    let userUpdated;
    if (changes.password) {
      const password = await bcrypt.hash(changes.password, 10);
      userUpdated = { ...changes, password: password };
    } else {
      userUpdated = { ...changes };
    }
    await db.usuarios.update(userUpdated, { where: { username } });
    delete userUpdated.password;
    return userUpdated;
  }


  async updateAlmacenFromUser(username, id_almacen, changes) {
    const almacen = await db.almacenes_por_usuario.findAll({ where: { username: username, id_almacen: id_almacen } });
    if (almacen.length == 0) {
      const newUser = await db.almacenes_por_usuario.create({ username: username, id_almacen: id_almacen, habilitado: changes });
      return newUser;
    } else {
      const result = await db.almacenes_por_usuario.update({ habilitado: changes }, { where: { username: username, id_almacen: id_almacen } });
      return result;
    }
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

  async findAllAlmacenesassigned() {
    return await db.almacenes_por_usuario.findAll();
  }

  async findByUser(username) {
    const almacenes = await db.almacenes_por_usuario.findAll({
      where: { username },
      include: ['almacen']
    });
    return almacenes;
  }

  async findUsersByAlmacen(id_almacen) {
    const almacenes = await db.almacenes_por_usuario.findAll({
      where: { id_almacen }
    });
    return almacenes;
  }

  async deleteAlmacenFromUser(username, id_almacen) {
    const index = await db.almacenes_por_usuario.destroy({
      where: { username, id_almacen }
    });
    if (!index) throw boom.notFound('El item no existe');
    return { message: "El item fue eliminado", index };
  }

  async paginate(offset, limit, username) {
    if (!username) username = ""
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.usuarios.count({
      where: {
        username: { [Op.like]: `%${username}%` },
        id_rol: { [Op.notIn]: { [Op.or]: ["Super seguridad", "Seguridad"] } }
      },
    });
    const result = await db.usuarios.findAll({
      where: {
        username: { [Op.like]: `%${username}%` },
        id_rol: { [Op.notIn]:  ["Super seguridad", "Seguridad"]  }
      },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = UsuariosService
