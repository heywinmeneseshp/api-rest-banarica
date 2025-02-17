const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class BuqueService {
  async create(data) {
    try {
      const buque = await db.Buque.create(data);
      return buque;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el buque');
    }
  }

  async bulkCreate(dataArray) {
    const transaction = await db.sequelize.transaction(); // Inicia la transacción
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
      }
  
      console.log(dataArray);
  
      const results = await db.Buque.bulkCreate(dataArray, { 
        validate: true,
        transaction // Pasa la transacción
      });
  
      await transaction.commit(); // Confirma los cambios si todo salió bien
  
      return { message: 'Carga masiva exitosa', count: results.length };
    } catch (error) {
      await transaction.rollback(); // Revierte los cambios si hay un error
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
    return db.Buque.findAll();
  }

  async findOne(id) {
    const buque = await db.Buque.findByPk(id);
    if (!buque) {
      throw boom.notFound('El buque no existe');
    }
    return buque;
  }

  async update(id, changes) {
    const buque = await this.findOne(id);
    await buque.update(changes);
    return { message: 'El buque fue actualizado', id, changes };
  }

  async delete(id) {
    const buque = await this.findOne(id);
    await buque.destroy();
    return { message: 'El buque fue eliminado', id };
  }

  async paginate(offset, limit, buque = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = buque ? { buque: { [Op.like]: `%${buque}%` } } : {};

    const [result, total] = await Promise.all([
      db.Buque.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
      }),
      db.Buque.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = BuqueService;
