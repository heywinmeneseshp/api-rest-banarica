const boom = require('@hapi/boom');
const { Op, where } = require('sequelize');
const db = require('../../models');

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
      console.log("Cuerpo recibido:", body);

      // Validación de seguridad para offset y limit
      const parsedOffset = isNaN(parseInt(offset)) ? 0 : (parseInt(offset) - 1) * parseInt(limit);
      const parsedLimit = isNaN(parseInt(limit)) ? 10 : parseInt(limit);

      // Extraer datos de body con valores por defecto
      const { semana = "", productor = "", contenedor = "", producto = "" } = body;

      // Construcción condicional de filtros
      const filters = {
        contenedor: contenedor ? { contenedor: { [Op.like]: `%${contenedor}%` } } : {},
        productor: productor ? { nombre: { [Op.like]: `%${productor}%` } } : {},
        producto: producto ? { nombre: { [Op.like]: `%${producto}%` } } : {},
        semana: semana ? { consecutivo: { [Op.like]: `%${semana}%` } } : {} // Corrección aquí
      };

      // Definir la estructura de asociaciones para evitar código repetido
      const includes = [
        {
          model: db.Contenedor,
          where: filters.contenedor,
          include: [{
            model: db.Listado,
            include: [{
              model: db.Embarque,
              include: [{
                model: db.semanas,
                where: filters.semana
              }]
            }]
          }]
        },
        { model: db.MotivoDeRechazo },
        { model: db.usuarios },
        {
          model: db.almacenes,
          where: filters.productor
        },
        {
          model: db.combos,
          where: filters.producto
        }
      ];

      // Ejecutar ambas consultas en paralelo para mejorar rendimiento
      const [result, total] = await Promise.all([
        db.Rechazo.findAll({
          limit: parsedLimit,
          offset: parsedOffset,
          include: includes
        }),
        db.Rechazo.count({ include: includes })
      ]);


      console.log(body)
      return { data: result, total };
    } catch (error) {
      console.error("Error en la paginación:", error);
      throw new Error("Ocurrió un error al obtener los datos paginados.");
    }
  }




}

module.exports = RechazoService;
