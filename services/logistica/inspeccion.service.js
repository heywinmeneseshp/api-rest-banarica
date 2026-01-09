const boom = require('@hapi/boom');
const { Op, where } = require('sequelize');
const db = require('../../models');

class InspeccionService {
  async create(data) {
    try {
      const inspeccion = await db.Inspeccion.create(data);
      return inspeccion;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear la inspección');
    }
  }

  async find() {
    return db.Inspeccion.findAll();
  }

  async findOne(id) {
    const inspeccion = await db.Inspeccion.findByPk(id);
    if (!inspeccion) {
      throw boom.notFound('La inspección no existe');
    }
    return inspeccion;
  }

  async update(id, changes) {
    const inspeccion = await db.Inspeccion.findByPk(id);
    if (!inspeccion) {
      throw boom.notFound('La inspección no existe');
    }
    await db.Inspeccion.update(changes, { where: { id } });
    return { message: 'La inspección fue actualizada', id, changes };
  }

  async delete(id) {
    const inspeccion = await db.Inspeccion.findByPk(id);
    if (!inspeccion) {
      throw boom.notFound('La inspección no existe');
    }
    await db.Inspeccion.destroy({ where: { id } });
    return { message: 'La inspección fue eliminada', id };
  }

  async paginate(offset, limit, body = {}) {


    const {
      cons_producto,
      cons_almacen,
      contenedor,
      fecha_inspeccion_inicio,
      fecha_inspeccion_fin
    } = body


       // 1. Construcción dinámica de filtros para mejorar el rendimiento de la DB
       const filters = {};
       filters.available = false
   
       if (cons_producto) filters.cons_producto = cons_producto;
   
   
       // Manejo de almacenes (Array o String)
       if (cons_almacen) filters.cons_almacen = cons_almacen;
   
  


       const includeModels = [
         { model: db.productos, as: 'producto' },
         { model: db.usuarios, as: 'usuario' },
         { model: db.Contenedor, as: 'contenedor' },
         { model: db.MotivoDeUso, where: {consecutivo: "INSP02"} },
       ];
      
       // 2. Lógica de Paginación Centralizada
       if (pagination) {
         const limit = parseInt(pagination.limit) || 10;
         const page = parseInt(pagination.offset) || 1;
         const offset = (page - 1) * limit;
   
    
         // findAndCountAll ejecuta ambas consultas de forma óptima
         const { count, rows } = await db.serial_de_articulos.findAndCountAll({
           where: filters,
           include: includeModels,
           limit: limit,
           offset: offset,
           order: [['updatedAt', 'DESC']],
           distinct: true // Necesario cuando hay includes (JOINs) para contar correctamente
         });
   
         return { data: rows, total: count };
       }
   
       // Retorno sin paginación
       return await db.serial_de_articulos.findAll({
         where: filters,
         include: includeModels,
         order: [['updatedAt', 'DESC']]
       });
     }
   
}

module.exports = InspeccionService;
