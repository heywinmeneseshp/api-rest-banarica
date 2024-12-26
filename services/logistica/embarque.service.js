const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class EmbarqueService {
  async create(data) {
    try {
      const embarque = await db.Embarque.create({...data, habilitado: true});
      return embarque;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el embarque');
    }
  }

  async cargueMasivo(data) {
    try {
      const t = await db.sequelize.transaction();
      const embarque = await db.Embarque.bulkCreate(data, { transaction: t });
      await t.commit();
      return embarque;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el embarque');
    }
  }

  async find() {
    return db.Embarque.findAll();
  }

  async findOne(id) {
    const embarque = await db.Embarque.findByPk(id);
    if (!embarque) {
      throw boom.notFound('El embarque no existe');
    }
    return embarque;
  }

  async update(id, changes) {
    const embarque = await db.Embarque.findByPk(id);
    if (!embarque) {
      throw boom.notFound('El embarque no existe');
    }
    await db.Embarque.update(changes, { where: { id } });
    return { message: 'El embarque fue actualizado', id, changes };
  }

  async delete(id) {
    const embarque = await db.Embarque.findByPk(id);
    if (!embarque) {
      throw boom.notFound('El embarque no existe');
    }
    await db.Embarque.destroy({ where: { id } });
    return { message: 'El embarque fue eliminado', id };
  }


  async paginate(offset, limit, filters = {}) {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = { ...filters };
    const { semana, cliente, booking, naviera, destino, bl, anuncio, viaje, buque, sae } = whereClause;
    const { rows: result, count: total } = await db.Embarque.findAndCountAll({
      where: {
        booking: { [Op.like]: `%${booking || ''}%` },
        viaje: { [Op.like]: `%${viaje || ''}%` },
        bl: { [Op.like]: `%${bl || ''}%` },
        anuncio: { [Op.like]: `%${anuncio || ''}%` },
        sae: { [Op.like]: `%${sae || ''}%` }
      },
      limit: parseInt(limit),
      offset: parsedOffset,
      order: [['id', 'DESC']],
      include: [
        {
          model: db.Destino,
          where: { destino: { [Op.like]: `%${destino || ''}%` } }
        },
        {
          model: db.Naviera,
          where: { navieras: { [Op.like]: `%${naviera || ''}%` } }
        },
        {
          model: db.clientes,
          where: { cod: { [Op.like]: `%${cliente || ''}%` } }
        },
        {
          model: db.Buque,
          where: { buque: { [Op.like]: `%${buque || ''}%` } }
        },
        {
          model: db.semanas,
          where: { consecutivo: { [Op.like]: `%${semana || ''}%` } }
        }
      ],
      distinct: true // Asegura que el conteo sea correcto y no se dupliquen los registros.
    });
    return { data: result, total };
  }
  
}

module.exports = EmbarqueService;
