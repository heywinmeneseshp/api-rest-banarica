const db = require('../models');
const { generarConsecutivoSemana } = require('../middlewares/generarId.handler');

function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getDefaultWeekOneMonday(year) {
  const janFirst = new Date(Date.UTC(year, 0, 1));
  const day = janFirst.getUTCDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  return addDays(janFirst, distanceToMonday);
}

class ConfigService {
  constructor() {}

  normalizeSemanaConfig(moduloData) {
    const now = new Date();
    const currentYear = parseInt(moduloData.anho_actual, 10) || now.getFullYear();
    const totalWeeks = parseInt(moduloData.total_semanas_anho, 10) || 52;
    const weekOneMonday = moduloData.fecha_inicio_semana_1
      ? new Date(moduloData.fecha_inicio_semana_1)
      : getDefaultWeekOneMonday(currentYear);

    return {
      ...moduloData,
      anho_actual: currentYear,
      total_semanas_anho: totalWeeks,
      fecha_inicio_semana_1: toDateOnlyString(weekOneMonday),
    };
  }

  buildWeeksForYear({ anho_actual, fecha_inicio_semana_1, total_semanas_anho }) {
    const firstMonday = new Date(fecha_inicio_semana_1);
    const totalWeeks = parseInt(total_semanas_anho, 10);
    const year = String(anho_actual);

    return Array.from({ length: totalWeeks }, (_, index) => {
      const weekNumber = index + 1;
      const startDate = addDays(firstMonday, index * 7);
      const endDate = addDays(startDate, 6);

      return {
        consecutivo: generarConsecutivoSemana(weekNumber, year),
        semana: String(weekNumber).padStart(2, '0'),
        anho: year,
        fecha_inicio: toDateOnlyString(startDate),
        fecha_fin: toDateOnlyString(endDate),
        dias_semana: 7,
      };
    });
  }

  getCurrentWeekNumber(weeks) {
    const today = toDateOnlyString(new Date());
    const currentWeek = weeks.find(
      (week) => today >= week.fecha_inicio && today <= week.fecha_fin,
    );

    if (currentWeek) {
      return parseInt(currentWeek.semana, 10);
    }

    if (weeks.length === 0) {
      return 1;
    }

    if (today < weeks[0].fecha_inicio) {
      return 1;
    }

    return parseInt(weeks[weeks.length - 1].semana, 10);
  }

  async syncWeeksCalendar(moduloData) {
    const normalized = this.normalizeSemanaConfig(moduloData);
    const weeks = this.buildWeeksForYear(normalized);
    const currentWeekNumber = this.getCurrentWeekNumber(weeks);

    await db.semanas.destroy({
      where: {
        anho: String(normalized.anho_actual),
        consecutivo: { [db.Sequelize.Op.ne]: 'S00-2000' },
      },
    });

    await db.semanas.bulkCreate(weeks);

    return {
      ...normalized,
      semana_actual: currentWeekNumber,
    };
  }

  async find(modulo) {
    let [configuracion] = await db.configuracion.findOrCreate({
      where: { modulo },
      defaults: {
        habilitado: false,
        semana_actual: 1,
        semana_siguiente: 2,
        semana_previa: 2,
        anho_actual: new Date().getFullYear(),
        fecha_inicio_semana_1: toDateOnlyString(
          getDefaultWeekOneMonday(new Date().getFullYear()),
        ),
        total_semanas_anho: 52,
        detalles: JSON.stringify({ menu: [], submenu: [] }),
      },
    });

    let moduloData = configuracion.dataValues;

    if (modulo === 'Semana') {
      const synced = await this.syncWeeksCalendar(moduloData);

      if (
        synced.semana_actual !== moduloData.semana_actual ||
        synced.fecha_inicio_semana_1 !== moduloData.fecha_inicio_semana_1 ||
        synced.total_semanas_anho !== moduloData.total_semanas_anho
      ) {
        await configuracion.update({
          ...synced,
          modulo,
        });
        moduloData = { ...moduloData, ...synced };
      } else {
        moduloData = synced;
      }
    }

    return [moduloData];
  }

  async update(data) {
    if (data.modulo === 'Semana') {
      const synced = await this.syncWeeksCalendar(data);
      return await db.configuracion.update(
        { ...data, ...synced },
        {
          where: {
            modulo: data.modulo,
          },
        },
      );
    }

    return await db.configuracion.update(data, {
      where: {
        modulo: data.modulo,
      },
    });
  }
}

module.exports = ConfigService;
