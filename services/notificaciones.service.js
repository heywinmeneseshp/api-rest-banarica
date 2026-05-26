const boom = require('@hapi/boom');
const db = require('../models')

class NotificacionesService {
  parseVehiculosSinCombustible(configRows) {
    try {
      const [config = {}] = configRows || [];
      const parsed = JSON.parse(config?.detalles || '{}');
      return Array.isArray(parsed?.vehiculosSinCombustible)
        ? parsed.vehiculosSinCombustible.map((item) => String(item))
        : [];
    } catch (error) {
      console.warn('No se pudo leer la configuracion de Programador_combustible:', error);
      return [];
    }
  }

  async getVehiculosSinCombustibleSet() {
    const configRows = await db.configuracion.findAll({
      where: { modulo: 'Programador_combustible' },
    });
    return new Set(this.parseVehiculosSinCombustible(configRows));
  }

  filterExcludedNotifications(items = [], vehiculosSinCombustible = new Set()) {
    return items.filter((item) => {
      const vehiculoId = String(item?.record_consumo?.vehiculo_id || item?.record_consumo?.vehiculo?.id || '');
      return !vehiculoId || !vehiculosSinCombustible.has(vehiculoId);
    });
  }

  async create(data) {
    let consecutivo = 'NT-' + (Date.now() - 1662564279341);
    const itemNuevo = await { consecutivo, ...data };
    await db.notificaciones.create(itemNuevo);
    return itemNuevo;
  }

  async find() {
    const vehiculosSinCombustible = await this.getVehiculosSinCombustibleSet();
    let result = await db.notificaciones.findAll({
      include: [{ model: db.record_consumos, include: { model: db.vehiculo } }],
      order: [['id', 'DESC']],
    });
    return this.filterExcludedNotifications(result, vehiculosSinCombustible);
  }

  async findOne(consecutivo) {
    const item = await db.notificaciones.findOne({
      where: { consecutivo: consecutivo },
      include: [{ model: db.record_consumos, include: { model: db.vehiculo } }],
    });
    if (!item) throw boom.notFound('El item no existe');

    const vehiculosSinCombustible = await this.getVehiculosSinCombustibleSet();
    const [visibleItem] = this.filterExcludedNotifications([item], vehiculosSinCombustible);
    if (!visibleItem) throw boom.notFound('El item no existe');
    return visibleItem;
  }

  async filter(body) {
    const vehiculosSinCombustible = await this.getVehiculosSinCombustibleSet();
    let items = await db.notificaciones.findAll({
      where: body,
      include: [{ model: db.record_consumos, include: { model: db.vehiculo } }],
      order: [['id', 'DESC']],
    });
    return this.filterExcludedNotifications(items, vehiculosSinCombustible);
  }

  async update(id, changes) {
    const item = await db.notificaciones.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.update(changes);
    return item;
  }

  async delete(id) {
    const item = await db.notificaciones.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: 'El item fue eliminado' };
  }

  async paginate(offset, limit, body) {
    const vehiculosSinCombustible = await this.getVehiculosSinCombustibleSet();
    const query = {
      where: body,
      include: [
        {
          model: db.record_consumos,
          include: { model: db.vehiculo }
        },
      ],
      order: [['id', 'DESC']]
    };

    const result = await db.notificaciones.findAll(query);
    const filteredRows = this.filterExcludedNotifications(result, vehiculosSinCombustible);

    if (offset && limit) {
      const newLimit = parseInt(limit);
      const newOffset = (parseInt(offset) - 1) * newLimit;
      return {
        data: filteredRows.slice(newOffset, newOffset + newLimit),
        total: filteredRows.length,
      };
    }

    return { data: filteredRows, total: filteredRows.length };
  }
}

module.exports = NotificacionesService
