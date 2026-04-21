const db = require('../models');
const { generarConsecutivoSemana } = require('../middlewares/generarId.handler');
const env = require('../config/env');

const EMAIL_CONFIG_MODULE = 'email_envio';
const DEFAULT_EMAIL_CONFIG = {
  smtp_host: env.smtpHost || 'smtp.gmail.com',
  smtp_port: env.smtpPort || 465,
  smtp_secure: typeof env.smtpSecure === 'boolean' ? env.smtpSecure : true,
  email_correo: env.email || '',
  password_correo: env.password || '',
  email_from_name: 'Bana Rica',
};

function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function parseDateOrNull(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getDefaultWeekOneMonday(year) {
  const janFirst = new Date(Date.UTC(year, 0, 1));
  const day = janFirst.getUTCDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  return addDays(janFirst, distanceToMonday);
}

class ConfigService {
  constructor() {}

  normalizeEmailConfig(detalles = {}) {
    const normalized = {
      ...DEFAULT_EMAIL_CONFIG,
      ...detalles,
      smtp_port: parseInt(detalles.smtp_port, 10) || DEFAULT_EMAIL_CONFIG.smtp_port,
      smtp_secure:
        typeof detalles.smtp_secure === 'boolean'
          ? detalles.smtp_secure
          : detalles.smtp_secure !== 'false' && detalles.smtp_secure !== false,
    };

    if (!normalized.email_correo) {
      normalized.email_correo = env.email || DEFAULT_EMAIL_CONFIG.email_correo;
    }

    if (!normalized.password_correo) {
      normalized.password_correo = env.password || DEFAULT_EMAIL_CONFIG.password_correo;
    }

    if (!normalized.smtp_host) {
      normalized.smtp_host = env.smtpHost || DEFAULT_EMAIL_CONFIG.smtp_host;
    }

    if (!normalized.smtp_port) {
      normalized.smtp_port = env.smtpPort || DEFAULT_EMAIL_CONFIG.smtp_port;
    }

    return normalized;
  }

  parseConfigDetails(detalles, fallback = {}) {
    if (!detalles) {
      return fallback;
    }

    if (typeof detalles === 'object') {
      return detalles;
    }

    try {
      return JSON.parse(detalles);
    } catch (error) {
      console.warn('Error al parsear detalles de configuracion:', error);
      return fallback;
    }
  }

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

  async upsertWeeksCalendar(weeks) {
    const persistedWeeks = [];

    for (const week of weeks) {
      const [weekRecord] = await db.semanas.findOrCreate({
        where: { consecutivo: week.consecutivo },
        defaults: week,
      });

      const needsUpdate =
        weekRecord.semana !== week.semana ||
        weekRecord.anho !== week.anho ||
        weekRecord.fecha_inicio !== week.fecha_inicio ||
        weekRecord.fecha_fin !== week.fecha_fin ||
        weekRecord.dias_semana !== week.dias_semana;

      if (needsUpdate) {
        await weekRecord.update(week);
      }

      persistedWeeks.push({
        id: weekRecord.id,
        consecutivo: week.consecutivo,
        semana: week.semana,
        anho: week.anho,
        fecha_inicio: week.fecha_inicio,
        fecha_fin: week.fecha_fin,
      });
    }

    return persistedWeeks;
  }

  getWeekIdForDate(date, persistedWeeks) {
    const normalizedDate = toDateOnlyString(date);
    const matchingWeek = persistedWeeks.find(
      (week) => normalizedDate >= week.fecha_inicio && normalizedDate <= week.fecha_fin,
    );

    return matchingWeek?.id || null;
  }

  async repairEmbarqueWeekReferences(persistedWeeks) {
    const embarques = await db.Embarque.findAll({
      attributes: ['id', 'id_semana', 'fecha_zarpe', 'fecha_arribo', 'createdAt'],
      include: [
        {
          model: db.semanas,
          attributes: ['id'],
          required: false,
        },
      ],
    });

    for (const embarque of embarques) {
      if (embarque.semana?.id) {
        continue;
      }

      const candidateDates = [
        parseDateOrNull(embarque.fecha_zarpe),
        parseDateOrNull(embarque.fecha_arribo),
        parseDateOrNull(embarque.createdAt),
      ].filter(Boolean);

      const nextWeekId = candidateDates
        .map((candidateDate) => this.getWeekIdForDate(candidateDate, persistedWeeks))
        .find(Boolean);

      if (nextWeekId) {
        await embarque.update({ id_semana: nextWeekId });
      }
    }
  }

  async syncWeeksCalendar(moduloData) {
    const normalized = this.normalizeSemanaConfig(moduloData);
    const weeks = this.buildWeeksForYear(normalized);
    const currentWeekNumber = this.getCurrentWeekNumber(weeks);
    const persistedWeeks = await this.upsertWeeksCalendar(weeks);
    await this.repairEmbarqueWeekReferences(persistedWeeks);

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

  async findEmailConfig() {
    const [config] = await db.configuracion.findOrCreate({
      where: { modulo: EMAIL_CONFIG_MODULE },
      defaults: {
        habilitado: false,
        detalles: JSON.stringify(DEFAULT_EMAIL_CONFIG),
      },
    });

    const detalles = this.normalizeEmailConfig(this.parseConfigDetails(config.detalles));
    return { modulo: config.modulo, detalles: JSON.stringify(detalles), ...detalles };
  }

  async updateEmailConfig(data) {
    const existing = await db.configuracion.findOne({ where: { modulo: EMAIL_CONFIG_MODULE } });
    const normalizedData = this.normalizeEmailConfig(data);

    if (!existing) {
      return await db.configuracion.create({
        modulo: EMAIL_CONFIG_MODULE,
        habilitado: false,
        detalles: JSON.stringify(normalizedData),
      });
    }

    const currentDetails = this.normalizeEmailConfig(this.parseConfigDetails(existing.detalles));
    const updatedDetails = this.normalizeEmailConfig({ ...currentDetails, ...normalizedData });

    return await db.configuracion.update(
      { detalles: JSON.stringify(updatedDetails) },
      { where: { modulo: EMAIL_CONFIG_MODULE } }
    );
  }
}

module.exports = ConfigService;
