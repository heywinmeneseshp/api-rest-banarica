const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class vehiculoService {
  normalizePayload(data = {}) {
    return {
      vehiculo: String(data?.vehiculo || '').trim(),
      modelo: String(data?.modelo || '').trim(),
      placa: String(data?.placa || '').trim().toUpperCase(),
      conductor_id: data?.conductor_id || null,
      categoria_id: data?.categoria_id || null,
      combustible: data?.combustible === '' || data?.combustible == null ? 0 : Number(data.combustible),
      gal_por_km: data?.gal_por_km === '' || data?.gal_por_km == null ? 0 : Number(data.gal_por_km),
      activo: typeof data?.activo === 'boolean' ? data.activo : data?.activo !== 'false',
    };
  }

  async create(data) {
    const payload = this.normalizePayload(data);
    const existe = await db.vehiculo.findOne({ where: { placa: payload.placa } });
    if (existe) throw boom.conflict(`Ya existe un vehiculo con la placa ${payload.placa}`);
    const newAlamacen = await db.vehiculo.create(payload);
    return newAlamacen
  }

  async find() {
    const vehiculo = await db.vehiculo.findAll()
    return vehiculo;
  }

  async findOne(id) {
    const item = await db.vehiculo.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const item = await db.vehiculo.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const payload = this.normalizePayload({ ...item.toJSON(), ...changes });
    const existe = await db.vehiculo.findOne({ where: { placa: payload.placa } });
    if (existe && String(existe.id) !== String(id)) {
      throw boom.conflict(`Ya existe un vehiculo con la placa ${payload.placa}`);
    }
    const result = await db.vehiculo.update(payload, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.vehiculo.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.vehiculo.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async paginate(offset, limit, item) {
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.vehiculo.count({
      where: { placa: { [Op.like]: `%${item}%` } }
    });
    const result = await db.vehiculo.findAll({
      where: { placa: { [Op.like]: `%${item}%` } },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

}

module.exports = vehiculoService
