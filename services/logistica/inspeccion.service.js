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
  } = body;

  // 1. Filtros para la tabla principal (serial_de_articulos)
  const filters = { available: false };
  if (cons_producto) filters.cons_producto = cons_producto;
  if (cons_almacen) filters.cons_almacen = cons_almacen;

  // 2. Preparación de filtros para tablas relacionadas
  const filtroContenedor = {};
  if (contenedor) {
    filtroContenedor.contenedor = { [Op.like]: `%${contenedor}%` };
  }

  const filtroInspeccion = {};
  if (fecha_inspeccion_inicio && fecha_inspeccion_fin) {
    // Formateamos a ISO 8601 con horas en 00:00:00.000Z
    const inicio = new Date(fecha_inspeccion_inicio);
    inicio.setUTCHours(0, 0, 0, 0);

    const fin = new Date(fecha_inspeccion_fin);
    fin.setUTCHours(23, 59, 59, 999); // El fin del día para incluir todo el rango

    filtroInspeccion.fecha_inspeccion = { [Op.between]: [inicio.toISOString(), fin.toISOString()] };
  }

  const includeModels = [
    { model: db.productos, as: 'producto' },
    { model: db.usuarios, as: 'usuario' },
    { 
      model: db.Contenedor, 
      as: 'contenedor', 
      where: Object.keys(filtroContenedor).length > 0 ? filtroContenedor : null,
      required: !!contenedor // Si hay filtro, hace INNER JOIN, si no, LEFT JOIN
    },
    { 
      model: db.MotivoDeUso, 
      where: { consecutivo: "INSP02" },
      required: true 
    },
    { 
      model: db.Inspeccion, 
      where: Object.keys(filtroInspeccion).length > 0 ? filtroInspeccion : null,
      required: !!fecha_inspeccion_inicio // Si busca por fecha, la inspección es obligatoria
    },
  ];

  // 3. Lógica de Paginación
  const parsedLimit = parseInt(limit) || 25;
  const page = parseInt(offset) || 1;
  const parsedOffset = (page - 1) * parsedLimit;

  const { count, rows } = await db.serial_de_articulos.findAndCountAll({
    where: filters,
    include: includeModels,
    limit: parsedLimit,
    offset: parsedOffset,
    order: [['updatedAt', 'DESC']],
    distinct: true // Evita duplicados en el conteo por los JOINS
  });

  return { data: rows, total: count };
}




}

module.exports = InspeccionService;
