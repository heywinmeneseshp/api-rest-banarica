const boom = require('@hapi/boom');
const { Op, Sequelize } = require('sequelize');
const db = require('../../models');


class ProgramacionService {

  async create(data) {
    const body = { ...data, eliminado: false }
    return await db.programacion.create(body);
  }


  async find() {
    return await db.programacion.findAll({
      include: [
        { model: db.productos_viajes },
        { model: db.conductores, as: 'conductor' },
        { model: db.rutas, include: [{ model: db.ubicaciones, as: 'ubicacion_1' }, { model: db.ubicaciones, as: 'ubicacion_2' }] },
        { model: db.clientes },
      ]
    });
  }

  async findOne(id) {
    const item = await db.programacion.findOne({ where: { id } });
    if (!item) {
      throw boom.notFound('El item no existe');
    }
    return item;
  }

  async update(id, changes) {
    const item = await db.programacion.findOne({ where: { id } });
    if (!item) {
      throw boom.notFound('El item no existe');
    }
    await db.programacion.update(changes, { where: { id } });
    return { message: "El item fue actualizado", id };
  }

  async delete(id) {
    const existe = await db.programacion.findOne({ where: { id } });
    if (!existe) {
      throw boom.notFound('El item no existe');
    }
    await db.programacion.destroy({ where: { id } });
    return { message: "El item fue eliminado", id };
  }

  async paginate(offset, limit, body) {

    let whereClause = {
      where: {
        semana: { [Op.like]: `%${body?.semana || ''}%` },
        fecha: { [Op.like]: `%${body?.fecha || ''}%` },
        movimiento: { [Op.like]: `%${body?.movimiento || ''}%` },
      },
      order: [['fecha', 'DESC'], ['vehiculo_id', 'DESC'], ['id', 'DESC']], // Ordenar por fecha de forma descendente
      include: [
        {
          model: db.rutas,
          include: [
            { model: db.ubicaciones, as: 'ubicacion_1' },
            { model: db.ubicaciones, as: 'ubicacion_2' },
            { model: db.galones_por_ruta }
          ],
          where: {
            ubicacion1: { [Op.like]: `%${body.ubicacion1 || ''}%` },
            ubicacion2: { [Op.like]: `%${body.ubicacion2 || ''}%` }
          }
        },
        { model: db.productos_viajes },
        {
          model: db.conductores,
          as: 'conductor',
          where: {
            conductor: { [Op.like]: `%${body.conductor || ''}%` }
          }
        },
        { model: db.clientes },
        {
          model: db.vehiculo,
          where: {
            placa: { [Op.like]: `%${body.vehiculo || ''}%` }
          }
        }
      ],
    };

    if (offset || limit) {
      let newLimit = parseInt(limit);
      let newOffset = (parseInt(offset) - 1) * newLimit;
      whereClause = {
        ...whereClause, limit: newLimit,
        offset: newOffset
      }
    }

    if (body.eliminado) whereClause.where.eliminado = body.eliminado

    const { count, rows: result } = await db.programacion.findAndCountAll(whereClause);

    return { data: result, total: count };
  }
}

module.exports = ProgramacionService;
