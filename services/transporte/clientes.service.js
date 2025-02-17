
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class clientesService {

  async create(data) {
    const existe = await db.clientes.findOne({ where: { nit: data.nit } });
    if (existe) throw boom.conflict('El item ya existe')
    const newAlamacen = await db.clientes.create(data);
    return newAlamacen
  }

  async bulkCreate(dataArray) {
    const transaction = await db.sequelize.transaction(); // Inicia la transacción
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
      }
  
      console.log(dataArray);
  
      const results = await db.clientes.bulkCreate(dataArray, { 
        validate: true,
        transaction // Se asegura de que todo ocurra dentro de la transacción
      });
  
      await transaction.commit(); // Confirma los cambios si todo salió bien
  
      return { message: 'Carga masiva exitosa', count: results.length };
    } catch (error) {
      await transaction.rollback(); // Revierte cualquier cambio si hay error
      console.error("Error en bulkCreate:", error);
  
      if (error.name === "SequelizeUniqueConstraintError") {
        const codExistente = error.errors?.[0]?.value || "desconocido";
        throw boom.conflict(`El código '${codExistente}' ya existe. Debe ser único.`);
      }
  
      if (error.name === "SequelizeValidationError") {
        const detalles = error.errors.map(err => err.message);
        throw boom.badRequest("Error de validación en los datos.", { detalles });
      }
  
      throw boom.internal("Error interno del servidor al crear el cliente.");
    }
  }
  
  async find() {
    try {
      const res = await db.clientes.findAll();
      if (!res.length) { // Si no hay resultados, crea un registro predeterminado
        const res2 = await db.clientes.create({
          razon_social: "Predeterminado",
          Nit: "100001000-1",
          cod: "PRE1"
        });
        return [res2]; // Retorna el nuevo registro en un array
      }
      return res; // Si ya existen clientes, retorna los resultados
    } catch (error) {
      console.error('Error al listar o crear cliente:', error);
      throw boom.internal('Error al listar o crear cliente', error);
    }
  }


  async findOne(id) {
    const item = await db.clientes.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const item = await db.clientes.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const result = await db.clientes.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.clientes.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.clientes.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async paginate(offset, limit, item) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.clientes.count({
      where: { razon_social: { [Op.like]: `%${item}%` } }
    });
    const result = await db.clientes.findAll({
      where: { razon_social: { [Op.like]: `%${item}%` } },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = clientesService