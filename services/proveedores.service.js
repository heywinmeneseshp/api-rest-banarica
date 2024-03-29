
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const { generarID } = require("../middlewares/generarId.handler");
const db = require('../models');

class ProveedoresService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id: "PV-0",
      razon_social: "Ramiro Perez",
      direccion: "Calle falsa 123",
      tel: "3226737763",
      email: "heywin1@gmail.com",
      isBlock: false
    });
  }

  async create(data) {
    const { count } = await db.proveedores.findAndCountAll()
    let consecutivo = "PV-" + count;
    const itemNuevo = { consecutivo, ...data }
    await db.proveedores.create(itemNuevo);
    return itemNuevo;
  }

  async find() {
    return await db.proveedores.findAll();
  }

  async findOne(consecutivo) {
    const proveedor = await db.proveedores.findOne({ where: { consecutivo: consecutivo } });
    if (!proveedor) throw boom.notFound('El proveedor no existe');
    return proveedor;
  }

  async update(id, changes) {
    const proveedor = await db.proveedores.findByPk(id);
    if (!proveedor) throw boom.notFound('El item no existe');
    await proveedor.update(changes);
    return proveedor;
  }

  async delete(id) {
    const item = await db.proveedores.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit, nombre) {
    console.log(nombre, "este esdsdsdsdsd" )
    if(!nombre) nombre = ""
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const result = await db.proveedores.findAll({
      where: { razon_social: { [Op.like]: `%${nombre}%` } },
      limit: newlimit,
      offset: newoffset
    });
    const total = await db.proveedores.count({
      where: { razon_social: { [Op.like]: `%${nombre}%` } },
    });
    return { data: result, total: total };
  }
}

module.exports = ProveedoresService
