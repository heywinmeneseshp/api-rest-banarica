
const db = require('../models');
const boom = require('@hapi/boom');

class RecepcionService {

  constructor() {}

  async create(data) {
    const t = await db.sequelize.transaction();
    try {
      // MAX(id) con lock, no COUNT(*): dos recepciones creadas al mismo
      // tiempo con un COUNT(*) sin lock pueden leer el mismo total y generar
      // el mismo consecutivo (mismo bug que ya se corrigio en
      // movimientos.service.js create(), que usa este mismo patron).
      const maxResult = await db.movimientos.findOne({
        attributes: [[db.sequelize.fn('MAX', db.sequelize.col('id')), 'maxId']],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const nextNum = (Number(maxResult?.dataValues?.maxId) || 0) + 1;
      const consecutivo = "RC-" + nextNum;
      const itemNuevo = { consecutivo, ...data };
      await db.movimientos.create(itemNuevo, { transaction: t });
      await t.commit();
      return itemNuevo;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async find() {
    const item = await db.movimientos.findAll({});
    return item;
  }

  async findOne(consecutivo) {
    const item = await db.movimientos.findOne({ where: { consecutivo: consecutivo },
      include: ['historial_movimientos'] });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async update(id, changes) {
    const pedido = await db.movimientos.findByPk(id);
    if (!pedido) throw boom.notFound('El item no existe');
    await pedido.update(changes);
    return pedido;
  }

  async delete(id) {
    const item = await db.movimientos.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset)-1 )* newlimit;
    const result = await db.movimientos.findAll({
    limit: newlimit,
    offset: newoffset
    });
    return result;
  }



}

module.exports = RecepcionService
