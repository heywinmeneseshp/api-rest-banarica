
const boom = require('@hapi/boom');
const { Op } = require("sequelize");
const db = require('../models');

class RecepcionService {

  constructor() {
  }

  async create(data) {
    const { count } = await db.traslados.findAndCountAll();
    const consecutivo = "TR-" + count;
    const itemNuevo = { consecutivo, ...data }
    const res = await db.traslados.create(itemNuevo);
    return res
  }

  async find() {
    return await db.traslados.findAll();
  }

  async findOne(consecutivo) {
    const items = await db.historial_movimientos.findAll({
      where: { cons_movimiento: consecutivo },
      include: ['Producto', 'traslado']
    })
    return items;
  }

  async update(id, changes) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.update(changes)
    return traslados
  }

  async delete(id) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginate(offset, limit, almacenes) {
    let almacenesCons = almacenes.map(almacen => almacen.consecutivo);
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.historial_movimientos.count({
      where: {
        [Op.or]: [{cons_almacen_gestor: {[Op.in]: almacenesCons} }, {cons_almacen_receptor: {[Op.in]: almacenesCons}}],
        cons_lista_movimientos: { [Op.in]: ["TR"] }
      }
    });
    const result = await db.historial_movimientos.findAll({
      where: {
        [Op.or]: [{cons_almacen_gestor: {[Op.in]: almacenesCons} }, {cons_almacen_receptor: {[Op.in]: almacenesCons}}],
        cons_lista_movimientos: { [Op.in]: ["TR"] }
      },
      include: ['Producto', 'traslado'],
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = RecepcionService
