const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');
const { registrarHistorialListado } = require('./listadoHistorial.helper');

class ContenedorService {
  async create(data) {
    try {
      const contenedor = await db.Contenedor.create(data);
      return contenedor;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el contenedor');
    }
  }

  async find() {
    return db.Contenedor.findAll();
  }

  async findOne(id) {
    const contenedor = await db.Contenedor.findByPk(id);
    if (!contenedor) {
      throw boom.notFound('El contenedor no existe');
    }
    return contenedor;
  }

  // Si cambia el codigo del contenedor, se registra en el historial de CADA
  // linea de Listado de ese contenedor (el historial general esta indexado
  // por linea, no por contenedor), asi "cual tenia, cual tiene" queda visible
  // aunque el cambio se haya hecho aqui y no en listado.service.js.
  async update(id, changes, usuario = null) {
    const contenedor = await this.findOne(id);
    const codigoAnterior = contenedor.contenedor;

    await contenedor.update(changes);

    const cambioCodigo = Object.prototype.hasOwnProperty.call(changes || {}, 'contenedor')
      && changes.contenedor
      && changes.contenedor !== codigoAnterior;

    if (cambioCodigo) {
      const lineas = await db.Listado.findAll({ where: { id_contenedor: id } });
      await Promise.all(lineas.map((linea) => registrarHistorialListado({
        listado_id: linea.id,
        accion: 'editado',
        usuario,
        datosAnteriores: { contenedor_codigo: codigoAnterior },
        datosNuevos: { contenedor_codigo: changes.contenedor },
        contenedorCodigo: changes.contenedor,
      })));
    }

    return { message: 'El contenedor fue actualizado', id, changes };
  }

  async delete(id) {
    const contenedor = await this.findOne(id);
    await contenedor.destroy();
    return { message: 'El contenedor fue eliminado', id };
  }

  async paginate(offset, limit, body = {}) {
    const parsedOffset = (parseInt(offset, 10) - 1) * parseInt(limit, 10);
  
    const whereClause = {
      ...body,
      ...(body.contenedor && { contenedor: { [Op.like]: `%${body.contenedor}%` } }),
    };
  
    const [data, total] = await Promise.all([
      db.Contenedor.findAll({
        where: whereClause,
        limit: parseInt(limit, 10),
        offset: parsedOffset,
      }),
      db.Contenedor.count({ where: whereClause }),
    ]);
  
    return { data, total };
  }
}

module.exports = ContenedorService;
