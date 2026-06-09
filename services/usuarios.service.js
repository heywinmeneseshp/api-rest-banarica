
const boom = require('@hapi/boom');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const db = require('../models');
const { normalizeRole, ROLES } = require('../middlewares/auth.handler');


class UsuariosService {

  constructor() { }

  async create(data) {
    const existe = await db.usuarios.findOne({ where: { username: data.username } });
    if (existe) throw boom.conflict('El usuarios ya existe')
    const password = await bcrypt.hash(data.password, 10);
    const user = {
      ...data,
      id_rol: normalizeRole(data.id_rol) || ROLES.OPERADOR,
      password: password,
      isBlock: Boolean(data.isBlock),
      password_changed_at: new Date(),
      password_reminder_sent_at: null,
      password_blocked_at: null,
    };
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
      delete item.dataValues.password_changed_at
      delete item.dataValues.password_reminder_sent_at
      delete item.dataValues.password_blocked_at
      delete item.dataValues.id
      return item.dataValues
    })
    return lista;
  }

  async findOne(username) {
    try {
      return await db.usuarios.findOne({ where: { username } });
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
      userUpdated = {
        ...changes,
        ...(changes.id_rol ? { id_rol: normalizeRole(changes.id_rol) } : {}),
        password: password,
        password_changed_at: new Date(),
        password_reminder_sent_at: null,
        password_blocked_at: null,
        isBlock: user.password_blocked_at ? false : user.isBlock,
      };
    } else {
      userUpdated = {
        ...changes,
        ...(changes.id_rol ? { id_rol: normalizeRole(changes.id_rol) } : {})
      };
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

  async updateTransportadoraFromUser(username, id_transportadora, changes) {
    const asignacion = await db.transportadoras_por_usuario.findAll({ where: { username, id_transportadora } });
    if (asignacion.length == 0) {
      return await db.transportadoras_por_usuario.create({ username, id_transportadora, habilitado: changes });
    }
    return await db.transportadoras_por_usuario.update({ habilitado: changes }, { where: { username, id_transportadora } });
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

  async addTransportadoraToUser(data) {
    const existe = await db.transportadoras_por_usuario.findOne({
      where: { username: data.username, id_transportadora: data.id_transportadora }
    });
    if (existe) throw boom.conflict('El item ya existe')
    return await db.transportadoras_por_usuario.create(data);
  }

  async findAllAlmacenesassigned() {
    return await db.almacenes_por_usuario.findAll();
  }

  async findAllTransportadorasAssigned() {
    return await db.transportadoras_por_usuario.findAll({
      include: [{ model: db.transportadoras, as: 'transportadora' }]
    });
  }

  async findByUser(username) {
    const almacenes = await db.almacenes_por_usuario.findAll({
      where: { username },
      include: ['almacen']
    });
    return almacenes;
  }

  async findTransportadorasByUser(username) {
    return await db.transportadoras_por_usuario.findAll({
      where: { username },
      include: [{ model: db.transportadoras, as: 'transportadora' }]
    });
  }

  async findUsersByAlmacen(id_almacen) {
    const almacenes = await db.almacenes_por_usuario.findAll({
      where: { id_almacen }
    });
    return almacenes;
  }

  async findUsersByTransportadora(id_transportadora) {
    return await db.transportadoras_por_usuario.findAll({
      where: { id_transportadora }
    });
  }

  async deleteAlmacenFromUser(username, id_almacen) {
    const deletedRows = await db.almacenes_por_usuario.destroy({
      where: { username, id_almacen }
    });
  
    if (deletedRows === 0) {
      throw boom.notFound('El item no existe');
    }
    return { message: "El item fue eliminado", index: deletedRows };
  }

  async deleteTransportadoraFromUser(username, id_transportadora) {
    const deletedRows = await db.transportadoras_por_usuario.destroy({
      where: { username, id_transportadora }
    });

    if (deletedRows === 0) {
      throw boom.notFound('El item no existe');
    }
    return { message: "El item fue eliminado", index: deletedRows };
  }

  async paginate(offset, limit, username) {
    const newlimit = parseInt(limit);
    const newoffset = (parseInt(offset) - 1) * newlimit;

    const { count, rows: data } = await db.usuarios.findAndCountAll({
      where: {
        username: { [Op.like]: `%${username}%` },
        id_rol: { [Op.in]: [ROLES.SUPER_ADMIN, ROLES.OPERADOR, 'Administrador', 'Seguridad', 'Super seguridad'] }
      },
      limit: newlimit,
      offset: newoffset
    });

    return { data, total: count };
  }


}

module.exports = UsuariosService
