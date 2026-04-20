const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class ConsumoRutaVehiculoService {

  async create(data) {
    const existe = await db.consumo_ruta_vehiculo.findOne({ where: data });
    if (existe) {
      return { message: "Este item ya existe" }
    } else {
      let newData = data;
      newData.activo = true;
      return await db.consumo_ruta_vehiculo.create(newData);
    }
  }

  async find() {
    return db.consumo_ruta_vehiculo.findAll({
      include: [
        { model: db.vehiculo },
        { model: db.rutas, include: [
          { model: db.ubicaciones, as: 'ubicacion_1' },
          { model: db.ubicaciones, as: 'ubicacion_2' }
        ]}
      ]
    });
  }

  async findOne(id) {
    const item = await db.consumo_ruta_vehiculo.findOne({
      where: { id },
      include: [
        { model: db.vehiculo },
        { model: db.rutas, include: [
          { model: db.ubicaciones, as: 'ubicacion_1' },
          { model: db.ubicaciones, as: 'ubicacion_2' }
        ]}
      ]
    });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async findByBody(body) {
    const item = await db.consumo_ruta_vehiculo.findAll({
      where: body,
      include: [
        { model: db.vehiculo },
        { model: db.rutas, include: [
          { model: db.ubicaciones, as: 'ubicacion_1' },
          { model: db.ubicaciones, as: 'ubicacion_2' }
        ]}
      ]
    });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async update(id, changes) {
    const item = await db.consumo_ruta_vehiculo.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe');
    return await db.consumo_ruta_vehiculo.update(changes, { where: { id } });
  }

  async delete(id) {
    const existe = await db.consumo_ruta_vehiculo.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.consumo_ruta_vehiculo.destroy({ where: { id } });
    return { message: "El item fue eliminado", id };
  }

  async paginate(offset, limit, item) {
    const newLimit = parseInt(limit);
    const newOffset = (parseInt(offset) - 1) * newLimit;
    const total = await db.consumo_ruta_vehiculo.count();
    const result = await db.consumo_ruta_vehiculo.findAll({
      limit: newLimit,
      offset: newOffset,
      include: [
        { model: db.vehiculo },
        { model: db.rutas, include: [
          { model: db.ubicaciones, as: 'ubicacion_1' },
          { model: db.ubicaciones, as: 'ubicacion_2' }
        ]}
      ]
    });
    return { data: result, total };
  }
}

module.exports = ConsumoRutaVehiculoService;