
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class categoria_vehiculosService {

  async create(data) {
    const categoria = String(data?.categoria || '').trim();
    if (!categoria) {
      throw boom.badRequest('La categoria es obligatoria');
    }

    const existe = await db.categoria_vehiculos.findOne({ where: { categoria } });
    if (existe) throw boom.conflict('La categoria de vehiculo ya existe')
    const newAlamacen = await db.categoria_vehiculos.create({
      ...data,
      categoria,
      galones_por_kilometro: data?.galones_por_kilometro === '' || data?.galones_por_kilometro == null
        ? 0
        : Number(data.galones_por_kilometro),
      activo: typeof data?.activo === 'boolean' ? data.activo : data?.activo !== 'false',
    });
    return newAlamacen
  }

  async find() {
    const res = await db.categoria_vehiculos.findAll({
      order: [['id', 'DESC']]
    })
    return res;
  }

  async findOne(id) {
    const item = await db.categoria_vehiculos.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const item = await db.categoria_vehiculos.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const result = await db.categoria_vehiculos.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.categoria_vehiculos.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.categoria_vehiculos.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async bulkCreate(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0)
      throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
    const results = [], errors = [];
    for (let i = 0; i < dataArray.length; i++) {
      const row = dataArray[i];
      const categoria = String(row.categoria || '').trim();
      if (!categoria) { errors.push({ fila: i + 1, message: 'categoria requerida' }); continue; }
      const existe = await db.categoria_vehiculos.findOne({ where: { categoria } });
      if (existe) { errors.push({ fila: i + 1, categoria, message: 'Ya existe' }); continue; }
      try {
        await db.categoria_vehiculos.create({
          categoria,
          galones_por_kilometro: row.galones_por_kilometro == null ? 0 : Number(row.galones_por_kilometro),
          activo: row.activo !== false && row.activo !== 'false',
        });
        results.push({ fila: i + 1, categoria, status: 'ok' });
      } catch (e) { errors.push({ fila: i + 1, categoria, message: e.message }); }
    }
    return { message: `Carga completada. ${results.length} exitosos, ${errors.length} errores.`, total: results.length, errors: errors.length, errorDetails: errors };
  }

  async bulkUpdate(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0)
      throw boom.badRequest('El formato de los datos es incorrecto o está vacío.');
    const results = [], errors = [];
    for (let i = 0; i < dataArray.length; i++) {
      const { categoria, ...rest } = dataArray[i];
      if (!categoria) { errors.push({ fila: i + 1, message: 'categoria requerida' }); continue; }
      const item = await db.categoria_vehiculos.findOne({ where: { categoria } });
      if (!item) { errors.push({ fila: i + 1, categoria, message: `Categoría "${categoria}" no encontrada` }); continue; }
      const changes = {};
      if (rest.galones_por_kilometro !== undefined) changes.galones_por_kilometro = Number(rest.galones_por_kilometro);
      if (rest.activo !== undefined) changes.activo = rest.activo !== false && rest.activo !== 'false';
      if (!Object.keys(changes).length) { errors.push({ fila: i + 1, categoria, message: 'Sin campos válidos' }); continue; }
      await db.categoria_vehiculos.update(changes, { where: { categoria } });
      results.push({ fila: i + 1, categoria, status: 'ok' });
    }
    return { message: `Actualización completada. ${results.length} exitosos, ${errors.length} errores.`, total: results.length, errors: errors.length, errorDetails: errors };
  }

  async paginate(offset, limit, item) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const search = item || '';
    const total = await db.categoria_vehiculos.count({
      where: { categoria: { [Op.like]: `%${search}%` } }
    });
    const result = await db.categoria_vehiculos.findAll({
      where: { categoria: { [Op.like]: `%${search}%` } },
      order: [['id', 'DESC']],
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = categoria_vehiculosService
