const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class NavieraService {
  async create(data) {
    try {
      const naviera = await db.Naviera.create(data);
      return naviera;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear la naviera');
    }
  }



  async bulkCreate(dataArray) {
    const transaction = await db.sequelize.transaction(); // Inicia la transacción
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
      }
  
      const navieras = await db.Naviera.bulkCreate(dataArray, { 
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
    return db.Naviera.findAll();
  }

  async findOne(id) {
    const naviera = await db.Naviera.findByPk(id);
    if (!naviera) {
      throw boom.notFound('La naviera no existe');
    }
    return naviera;
  }

  async update(id, changes) {
    const naviera = await db.Naviera.findByPk(id);
    if (!naviera) {
      throw boom.notFound('La naviera no existe');
    }
    await db.Naviera.update(changes, { where: { id } });
    return { message: 'La naviera fue actualizada', id, changes };
  }

  async delete(id) {
    const naviera = await db.Naviera.findByPk(id);
    if (!naviera) {
      throw boom.notFound('La naviera no existe');
    }
    await db.Naviera.destroy({ where: { id } });
    return { message: 'La naviera fue eliminada', id };
  }

  async paginate(offset, limit, body = {}) {

    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = {...body,
      navieras: { [Op.like]: `%${body.navieras ? body.navieras : ""}%` },
      cod: { [Op.like]: `%${body.cod ? body.cod : ""}%` },
    }
 
    const [result, total] = await Promise.all([
      db.Naviera.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
        order: [["id", "DESC"]], // Ordenar por ID de mayor a menor
      }),
      db.Naviera.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }
}

module.exports = NavieraService;
