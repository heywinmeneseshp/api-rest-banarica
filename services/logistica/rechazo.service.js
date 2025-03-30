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
  
      // Validar y calcular offset y limit
      const parsedLimit = Number.isNaN(parseInt(limit)) ? 10 : Math.max(1, parseInt(limit));
      const parsedOffset = Number.isNaN(parseInt(offset)) ? 0 : Math.max(0, (parseInt(offset) - 1) * parsedLimit);
  
      // Extraer filtros con valores predeterminados
      const { semana = "", productor = "", contenedor = "", producto = "" } = body;
  
      // Construcción de filtros dinámicos
      const filters = {};
      if (contenedor) filters.contenedor = { contenedor: { [Op.like]: `%${contenedor}%` } };
      if (productor) filters.productor = { nombre: { [Op.like]: `%${productor}%` } };
      if (producto) filters.producto = { nombre: { [Op.like]: `%${producto}%` } };
      if (semana) filters.semana = { consecutivo: { [Op.like]: `%${semana}%` } };
  
      console.log("Filtros aplicados:", filters);
  
      // Definir asociaciones
      const includes = [
        {
          model: db.Contenedor,
          where: filters.contenedor,
          include: [
            {
              model: db.Listado,
              include: [
                {
                  model: db.Embarque,
                  include: [
                    {
                      model: db.semanas,
                      where: filters.semana
                    }
                  ]
                },
                {
                  model: db.combos
                },
                {
                  model: db.almacenes,
                  as: "almacen" // Corrección del alias
                }
              ]
            }
          ]
        },
        { model: db.MotivoDeRechazo },
        { model: db.usuarios },
        { model: db.almacenes, where: filters.productor },
        { model: db.combos, where: filters.producto }
      ];
  
      // Consultas en paralelo para mejor rendimiento
      const [result, total] = await Promise.all([
        db.Rechazo.findAll({ limit: parsedLimit, offset: parsedOffset, include: includes }),
        db.Rechazo.count({ include: includes })
      ]);
  
      return { data: result, total };
    } catch (error) {
      console.error("Error en la paginación:", error.message);
      throw new Error("Error al obtener los datos paginados. Detalles: " + error.message);
    }
  }
  



}

module.exports = RechazoService;
