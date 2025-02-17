
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../models');

class AlmacenesService {

  async create(data) {
    const existe = await db.almacenes.findOne({ where: { consecutivo: data.consecutivo } });
    if (existe) throw boom.conflict('El almacen ya existe')
    const newAlamacen = await db.almacenes.create(data);
    return newAlamacen
  }

  async bulkCreate(dataArray) {
    const transaction = await db.sequelize.transaction(); // Inicia la transacción
    try {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
        }
        
        console.log(dataArray);

        // Intentar la inserción en la base de datos dentro de la transacción
        const results = await db.almacenes.bulkCreate(dataArray, { 
            validate: true, 
            transaction // Asegurar que la transacción controla la operación
        });

        await transaction.commit(); // Confirmar la transacción si todo sale bien

        return { message: 'Carga masiva exitosa', count: results.length };
    } catch (error) {
        await transaction.rollback(); // Deshacer todos los cambios si hay un error
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
    const almacenes = await db.almacenes.findAll({
      order: [['id', 'DESC']], // Ordenar directamente en la consulta
    });

    return almacenes;
  }


  async findOne(consecutivo) {
    let almacen = await db.almacenes.findOne({ where: { id: consecutivo } });
    if (!almacen) {
      almacen = await db.almacenes.findOne({ where: { consecutivo } });
    }
    if (!almacen) throw boom.notFound('El almacén no existe');
    return almacen;
  }


  async update(consecutivo, changes) {
    let almacen = await db.almacenes.findOne({ where: { id: consecutivo } });
    if (!almacen) {
      almacen = await db.almacenes.findOne({ where: { consecutivo } });
    }
    if (!almacen) throw boom.notFound('El almacén no existe');
    const result = await db.almacenes.update(changes, { where: { id: almacen.id } });
    return result;
  }


  async delete(consecutivo) {
    const existe = await db.almacenes.findOne({ where: { consecutivo } });
    if (!existe) throw boom.notFound('El almacen no existe');
    await db.almacenes.destroy({ where: { consecutivo } });
    return { message: "El almacen fue eliminado", consecutivo }
  }


  async paginate(offset, limit, almacen = '') {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = almacen ? { nombre: { [Op.like]: `%${almacen}%` } } : {};

    const [result, total] = await Promise.all([
      db.almacenes.findAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parsedOffset,
        order: [['id', 'DESC']],
      }),
      db.almacenes.count({ where: whereClause }),
    ]);

    return { data: result, total };
  }

}

module.exports = AlmacenesService
