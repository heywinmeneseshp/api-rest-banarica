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
    await db.semanas.bulkCreate(weeks, {
      updateOnDuplicate: ['semana', 'anho', 'fecha_inicio', 'fecha_fin', 'dias_semana'],
    });

    return weeks.map((week) => ({
      consecutivo: week.consecutivo,
      semana: week.semana,
      anho: week.anho,
      fecha_inicio: week.fecha_inicio,
      fecha_fin: week.fecha_fin,
    }));
  }

  async syncWeeksCalendar(moduloData) {
    const normalized = this.normalizeSemanaConfig(moduloData);
    const weeks = this.buildWeeksForYear(normalized);
    const currentWeekNumber = this.getCurrentWeekNumber(weeks);
    await this.upsertWeeksCalendar(weeks);

    return {
      ...normalized,
      semana_actual: currentWeekNumber,
    };
  }

  async list(prefix = '') {
    const where = prefix
      ? { modulo: { [db.Sequelize.Op.like]: `${prefix}%` } }
      : {};

    return await db.configuracion.findAll({
      where,
      order: [['modulo', 'ASC']],
    });
  }

  async find(modulo, options = {}) {
    const { syncWeeks = true } = options;
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

    if (modulo === 'Semana' && syncWeeks) {
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

  // Todos los modelos Sequelize registrados (db.sequelize/db.Sequelize no son
  // modelos, se excluyen).
  _obtenerModelos() {
    return Object.keys(db)
      .filter((key) => key !== 'sequelize' && key !== 'Sequelize')
      .map((key) => db[key]);
  }

  // Exporta TODA la base de datos como JSON: { NombreModelo: [filas...] }.
  // Se usa Sequelize (no mysqldump) porque la conexion real pasa por un bridge
  // HTTP y no hay acceso directo al puerto de MySQL desde este servidor.
  async exportarBaseDatos() {
    const modelos = this._obtenerModelos();
    const resultado = {};

    for (const modelo of modelos) {
      resultado[modelo.name] = await modelo.findAll({ raw: true });
    }

    return resultado;
  }

  // Restaura la base de datos desde un export generado por exportarBaseDatos().
  // DESTRUCTIVO: por cada modelo presente en el archivo, borra todas sus filas
  // actuales y las reemplaza por las del archivo. Los modelos que NO esten en
  // el archivo no se tocan. Se desactivan temporalmente las FK para poder
  // borrar/insertar sin preocuparse por el orden entre tablas relacionadas.
  async importarBaseDatos(datos) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new Error('El archivo no tiene el formato esperado (debe ser un objeto {modelo: [filas]}).');
    }

    const modelosPorNombre = this._obtenerModelos().reduce((acc, modelo) => {
      acc[modelo.name] = modelo;
      return acc;
    }, {});

    const entradasValidas = Object.entries(datos).filter(([nombreModelo, filas]) => {
      return modelosPorNombre[nombreModelo] && Array.isArray(filas);
    });

    if (entradasValidas.length === 0) {
      throw new Error('El archivo no contiene ninguna tabla reconocida para importar.');
    }

    const resumen = [];
    const t = await db.sequelize.transaction();
    try {
      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

      for (const [nombreModelo, filas] of entradasValidas) {
        const modelo = modelosPorNombre[nombreModelo];
        // DELETE en vez de TRUNCATE: mas compatible con el bridge HTTP y no
        // requiere privilegios extra de TRUNCATE en el usuario de la BD.
        await db.sequelize.query(`DELETE FROM \`${modelo.getTableName()}\``, { transaction: t });
        if (filas.length > 0) {
          await modelo.bulkCreate(filas, { transaction: t, validate: false, ignoreDuplicates: false });
        }
        resumen.push({ modelo: nombreModelo, filas: filas.length });
      }

      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }

    return { message: 'Base de datos restaurada', tablas: resumen };
  }
}

module.exports = ConfigService;
