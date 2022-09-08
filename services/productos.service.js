const boom = require('@hapi/boom');
const { generarIDProAndCat } = require('../middlewares/generarId.handler');
const db = require('../models');

class ProductosService {

  constructor() { }

  async create(data) {
    try {
      const { count } = await db.productos.findAndCountAll();
      let consecutivo = generarIDProAndCat(data.name, ("xxx" + count))
      const producto = { consecutivo, ...data }
      await db.productos.create(producto)
      return producto
    } catch (error) {
      throw boom.badRequest(error)
    }
  }

  async find() {
    return await db.productos.findAll({ include: ['categoria'] });
  }

  async findPost(body) {
    return await db.productos.findAll({ where: body.producto,
      include: [{
        model: db.stock,
        as: "habilitados",
        where: body.stock
      }]
    });
  }

  async findOne(consecutivo) {
    const producto = await db.productos.findOne({
      where: { consecutivo: consecutivo },
      include: ['categoria']
    });
    if (!producto) throw boom.notFound('El producto no existe')
    return producto;
  }

  async findAllByCategory(category) {
    const productos = await db.productos.findAll({ where: { cons_categoria: category } })
    if (!productos) throw boom.notFound('No existen productos en esta categoria')
    return productos;
  }

  async update(id, changes) {
    const producto = await db.productos.findByPk(id)
    if (!producto) throw boom.notFound('El item no existe')
    await producto.update(changes)
    return producto
  }

  async delete(id) {
    const item = await db.productos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const result = await db.productos.findAll({
      limit: newlimit,
      offset: newoffset
    });
    return result;
  }

}

module.exports = ProductosService
