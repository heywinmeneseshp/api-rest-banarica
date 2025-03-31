const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class MotivoDeRechazoService {
  async create(data) {
    try {
      const motivoDeRechazo = await db.MotivoDeRechazo.create(data);
      return motivoDeRechazo;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el motivo de rechazo');
    }
  }

   async bulkCreate(dataArray) {
      const transaction = await db.sequelize.transaction(); // Inicia la transacción
      try {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
          throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
        }
    
        const navieras = await db.MotivoDeRechazo.bulkCreate(dataArray, { 
          validate: true,
          transaction // Pasa la transacción
        });
    
        await transaction.commit(); // Confirma los cambios si todo salió bien
    
        return { message: 'Carga masiva exitosa', count: navieras.length };
      } catch (error) {
        await transaction.rollback(); // Revierte los cambios en caso de error
        console.error("Error en bulkCreate:", error);
    
        if (error.name === "SequelizeUniqueConstraintError") {
          const codExistente = error.errors?.[0]?.value || "desconocido";
          throw boom.conflict(`El código '${codExistente}' ya existe. Debe ser único.`);
        }
    
        if (error.name === "SequelizeValidationError") {
          const detalles = error.errors.map(err => err.message);
          throw boom.badRequest("Error de validación en los datos de la naviera.", { detalles });
        }
    
        throw boom.internal("Error interno del servidor al crear la naviera.");
      }
    }

  async find() {
    return db.MotivoDeRechazo.findAll();
  }

  async findOne(id) {
    const motivoDeRechazo = await db.MotivoDeRechazo.findByPk(id);
    if (!motivoDeRechazo) {
      throw boom.notFound('El motivo de rechazo no existe');
    }
    return motivoDeRechazo;
  }

  async update(id, changes) {
    const motivoDeRechazo = await db.MotivoDeRechazo.findByPk(id);
    if (!motivoDeRechazo) {
      throw boom.notFound('El motivo de rechazo no existe');
    }
    await db.MotivoDeRechazo.update(changes, { where: { id } });
    return { message: 'El motivo de rechazo fue actualizado', id, changes };
  }

  async delete(id) {
    const motivoDeRechazo = await db.MotivoDeRechazo.findByPk(id);
    if (!motivoDeRechazo) {
      throw boom.notFound('El motivo de rechazo no existe');
    }
    await db.MotivoDeRechazo.destroy({ where: { id } });
    return { message: 'El motivo de rechazo fue eliminado', id };
  }
  
  async paginate(offset = 1, limit = 10, motivo_rechazo = '') {
    const parsedOffset = (Number.isNaN(parseInt(offset)) ? 0 : (parseInt(offset) - 1) * parseInt(limit));
    const parsedLimit = Number.isNaN(parseInt(limit)) ? 10 : parseInt(limit); // Valor por defecto si es NaN

    console.log(`Offset: ${parsedOffset}, Limit: ${parsedLimit}`);

    const whereClause = motivo_rechazo ? { motivo_rechazo: { [Op.like]: `%${motivo_rechazo}%` } } : {};

    const [result, total] = await Promise.all([
      db.MotivoDeRechazo.findAll({
        where: whereClause,
        limit: parsedLimit,
        offset: parsedOffset,
      }),
      db.MotivoDeRechazo.count({ where: whereClause }),
    ]);

    return { data: result, total };
}

}

module.exports = MotivoDeRechazoService;
