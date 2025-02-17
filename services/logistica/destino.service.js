const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class DestinoService {
  async create(data) {
    try {

      const destino = await db.Destino.create(data);
      return destino;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el destino');
    }
  }

  async bulkCreate(dataArray) {
    const transaction = await db.sequelize.transaction(); // Inicia la transacción
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
      }
  
      console.log(dataArray);
  
      const results = await db.Destino.bulkCreate(dataArray, { 
        validate: true,
        transaction // Asocia la transacción
      });
  
      await transaction.commit(); // Confirma los cambios si todo salió bien
  
      return { message: 'Carga masiva exitosa', count: results.length };
    } catch (error) {
      await transaction.rollback(); // Revierte los cambios en caso de error
      console.error("Error en bulkCreate:", error);
  
      if (error.name === "SequelizeUniqueConstraintError") {
        const codExistente = error.errors?.[0]?.value || "desconocido";
        throw boom.conflict(`El código '${codExistente}' ya existe. Debe ser único.`);
      }
  
      if (error.name === "SequelizeValidationError") {
        const detalles = error.errors.map(err => err.message);
        throw boom.badRequest("Error de validación en los datos.", { detalles });
      }
  
      throw boom.internal("Error interno del servidor al crear el item.");
    }
  }
  

  async find() {
    return db.Destino.findAll();
  }

  async findOne(id) {
    const destino = await db.Destino.findOne({ where: { id } });
    if (!destino) {
      throw boom.notFound('El destino no existe');
    }
    return destino;
  }

  async update(id, changes) {
    const destino = await db.Destino.findOne({ where: { id } });
    if (!destino) {
      throw boom.notFound('El destino no existe');
    }
    await db.Destino.update(changes, { where: { id } });
    return { message: 'El destino fue actualizado', id, changes };
  }

  async delete(id) {
    const destino = await db.Destino.findOne({ where: { id } });
    if (!destino) {
      throw boom.notFound('El destino no existe');
    }
    await db.Destino.destroy({ where: { id } });
    return { message: 'El destino fue eliminado', id };
  }

  async paginate(offset, limit, destino = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = destino ? { destino: { [Op.like]: `%${destino}%` } } : {};

    const [result, total] = await Promise.all([
      db.Destino.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Destino.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = DestinoService;
