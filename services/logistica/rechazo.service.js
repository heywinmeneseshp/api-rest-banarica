const boom = require('@hapi/boom');
const { Op, where } = require('sequelize');
const db = require('../../models');
const { required } = require('joi');

class RechazoService {
  async create(data) {
    try {
      const rechazo = await db.Rechazo.create(data);
      return rechazo;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el rechazo');
    }
  }

  async find() {
    return db.Rechazo.findAll();
  }

  async findOne(id) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    return rechazo;
  }

  async update(id, changes) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    await db.Rechazo.update(changes, { where: { id } });
    return { message: 'El rechazo fue actualizado', id, changes };
  }

  async delete(id) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    await db.Rechazo.destroy({ where: { id } });
    return { message: 'El rechazo fue eliminado', id };
  }




async paginate(offset, limit, body) {
  try {
    const parsedLimit = parseInt(limit, 10) || 10;
    const currentPage = parseInt(offset, 10) || 1;
    const parsedOffset = (currentPage - 1) * parsedLimit;

    const { semana, productor, contenedor, producto } = body;

    const whereConditions = {}; 

    const includes = [
      {
        model: db.Contenedor,
        // CRUCIAL: Si hay semana, el Contenedor TIENE que ser obligatorio
        required: !!(semana || contenedor), 
        where: contenedor ? { contenedor: { [Op.like]: `%${contenedor}%` } } : {},
        include: [
          {
            model: db.Listado,
            // CRUCIAL: Si hay semana, el Listado TIENE que ser obligatorio
            required: !!semana, 
            include: [
              {
                model: db.Embarque,
                // Si pones el where aquí, Sequelize debería filtrar, 
                // pero usamos !!semana para forzar el INNER JOIN
                required: !!semana, 
                where: semana ? { id_semana: semana } : {}, 
                include: [ { model: db.semanas } ]
              },
              { model: db.combos },
              { model: db.almacenes, as: "almacen" }
            ]
          }
        ]
      },
      { model: db.MotivoDeRechazo },
      { model: db.usuarios },
      { 
        model: db.almacenes, 
        where: productor ? { nombre: { [Op.like]: `%${productor}%` } } : {},
        required: !!productor // Si buscas productor y no hay match, elimina el Rechazo
      },
      { 
        model: db.combos,
        where: producto ? { nombre: { [Op.like]: `%${producto}%` } } : {},
        required: !!producto // Si buscas producto y no hay match, elimina el Rechazo
      }
    ];

    const [result, total] = await Promise.all([
      db.Rechazo.findAll({
        limit: parsedLimit,
        offset: parsedOffset,
        where: whereConditions,
        include: includes,
        order: [['id', 'DESC']],
        distinct: true, 
        subQuery: false // Mantener en false para que los filtros profundos funcionen
      }),
      db.Rechazo.count({
        where: whereConditions,
        include: includes, 
        distinct: true,
        col: 'id'
      })
    ]);

    return { 
      data: result, 
      total,
      currentPage,
      totalPages: Math.ceil(total / parsedLimit)
    };

  } catch (error) {
    console.error("Error en la paginación de Rechazos:", error.message);
    throw error;
  }
}
}

module.exports = RechazoService;
