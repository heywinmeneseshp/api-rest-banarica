
const boom = require('@hapi/boom');
const { generarIDSemana } = require("../middlewares/generarId.handler");
const db = require('../models');
const { Op } = require('sequelize');

class SemanasService {

  constructor() { }


  async create(data) {
    const consecutivo = generarIDSemana(data.semana, data.anho);
    const itemNuevo = { consecutivo: consecutivo, ...data }
    await db.semanas.create(itemNuevo);
    return itemNuevo;
  }

  async find() {
    return await db.semanas.findAll();
  }

  async findOne(consecutivo) {
    const semana = await db.semanas.findOne({ where: { consecutivo: consecutivo } });
    if (!semana) throw boom.notFound('El item no existe');
    return semana;
  }

  async filtrar(body) {

    try {
      // Destructuramos `createdAt` de body para evitar acceder múltiples veces
      const { createdAt, ...otherBody } = body;
      // Si `createdAt` tiene un array de 2 fechas, aplicamos el filtro
      const filtroFecha = createdAt?.length === 2 ? { createdAt: { [Op.between]: createdAt } } : {};
      // Fusionamos otros filtros y el de la fecha si aplica
      const filtros = { ...otherBody, ...filtroFecha };
      // Realizamos la búsqueda con los filtros
      console.log(filtros);
      const semana = await db.semanas.findAll({ where: filtros });
      return semana || [];
    } catch (error) {
      // Manejamos cualquier otro error que ocurra durante la operación
      throw boom.badImplementation('Error al filtrar los datos', { error });
    }
  }


  async update(id, changes) {
    const semana = await db.semanas.findByPk(id);
    if (!semana) throw boom.notFound('El item no existe');
    await semana.update(changes);
    return semana;
  }

  async delete(id) {
    const item = await db.semanas.findByPk(id);
    if (!item) throw boom.notFound('El item no existe');
    await item.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

  async paginar(offset, limit, consecutivo) {
    // CORRECCIÓN CRUCIAL: Convertir a números enteros
    const pLimit = parseInt(limit, 10) || 10;
    const pPage = parseInt(offset, 10) || 1;

    // Calcular el salto de registros
    const newOffset = (pPage - 1) * pLimit;

    console.log(`Ejecutando paginación: Offset real ${newOffset}, Limite ${pLimit}`);

    return await db.semanas.findAll({
      // Ahora pasamos números, no strings
      limit: pLimit,
      offset: newOffset,
      where: {
        consecutivo: { [Op.like]: `%${consecutivo}%` }
      },
      order: [['id', 'DESC']]
    });
  }

  parseWeekValue(value) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  getWeekRecordKey(item) {
    const week = this.parseWeekValue(item?.semana);
    const year = this.parseWeekValue(item?.anho);
    if (!week || !year) {
      return null;
    }
    return `${year}-${String(week).padStart(2, '0')}`;
  }

  buildAllowedWeekKeys({ anho_actual, semana_actual, semana_previa, semana_siguiente, total_semanas_anho }) {
    const year = this.parseWeekValue(anho_actual);
    const currentWeek = this.parseWeekValue(semana_actual);
    const prev = Math.max(this.parseWeekValue(semana_previa) || 0, 0);
    const next = Math.max(this.parseWeekValue(semana_siguiente) || 0, 0);
    const totalWeeks = Math.max(this.parseWeekValue(total_semanas_anho) || 52, 1);

    if (!year || !currentWeek) {
      return [];
    }

    const result = new Set();

    for (let offset = -prev; offset <= next; offset += 1) {
      let week = currentWeek + offset;
      let targetYear = year;

      while (week < 1) {
        targetYear -= 1;
        const previousYearWeeks = Math.max(totalWeeks, 1);
        week += previousYearWeeks;
      }

      while (week > totalWeeks) {
        week -= totalWeeks;
        targetYear += 1;
      }

      result.add(`${targetYear}-${String(week).padStart(2, '0')}`);
    }

    return Array.from(result);
  }

  async rangoSemana(body = {}) {
    const allowedKeys = this.buildAllowedWeekKeys(body);
    if (!allowedKeys.length) {
      return [];
    }

    const allowedPairs = allowedKeys
      .map((key) => {
        const [year, week] = String(key).split('-');
        return { anho: year, semana: week };
      })
      .filter((item) => item.anho && item.semana);

    if (!allowedPairs.length) {
      return [];
    }

    return await db.semanas.findAll({
      where: {
        [Op.or]: allowedPairs,
      },
      order: [['anho', 'ASC'], ['semana', 'ASC']],
    });
  }


}

module.exports = SemanasService
