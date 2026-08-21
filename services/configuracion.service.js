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

  // Nombre real de columna en la BD para un atributo de Sequelize (puede
  // diferir del nombre del atributo si el modelo usa `field: '...'`).
  _nombreColumna(modelo, atributo) {
    return modelo.rawAttributes?.[atributo]?.field || atributo;
  }

  // Escapa un valor JS para insertarlo literal en SQL. Misma convencion que
  // ya usa mysql-http-bridge.js para las fechas (UTC, 'YYYY-MM-DD HH:MM:SS'),
  // asi el .sql exportado es coherente con como esta app ya guarda/lee fechas.
  // permiteNull indica si la columna destino admite NULL: si no lo admite y
  // el valor es invalido/nulo (datos corruptos preexistentes, p.ej. un
  // "0000-00-00" de MySQL que Sequelize lee como Date NaN), se usa una fecha
  // de reemplazo en vez de NULL para no romper el INSERT/REPLACE por una fila
  // que ya venia mal antes de este export.
  _escaparValorSql(valor, permiteNull = true) {
    const nulo = () => (permiteNull ? 'NULL' : `'1970-01-01 00:00:00'`);

    if (valor === null || valor === undefined) return nulo();
    if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : nulo();
    if (typeof valor === 'boolean') return valor ? '1' : '0';
    if (valor instanceof Date) {
      if (Number.isNaN(valor.getTime())) return nulo();
      return `'${valor.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    if (Buffer.isBuffer(valor)) {
      return `0x${valor.toString('hex')}`;
    }
    if (typeof valor === 'object') {
      valor = JSON.stringify(valor);
    }
    return `'${String(valor).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }

  // Exporta TODA la base de datos como un archivo .sql estandar (DELETE +
  // INSERT por tabla), ejecutable con cualquier cliente MySQL. Se genera con
  // Sequelize (no mysqldump) porque la conexion real pasa por un bridge HTTP
  // y no hay acceso directo al puerto de MySQL desde este servidor.
  async exportarBaseDatosSql() {
    const modelos = this._obtenerModelos();
    const LOTE = 500;
    const partes = [
      `-- Backup de Bana Rica generado el ${new Date().toISOString()}`,
      'SET FOREIGN_KEY_CHECKS=0;',
      '',
    ];

    for (const modelo of modelos) {
      const tabla = modelo.getTableName();
      try {
        const filas = await modelo.findAll({ raw: true });

        partes.push(`-- Tabla: ${tabla} (${filas.length} filas)`);
        partes.push(`DELETE FROM \`${tabla}\`;`);

        if (filas.length > 0) {
          const atributos = Object.keys(modelo.rawAttributes);
          const columnas = atributos.map((a) => `\`${this._nombreColumna(modelo, a)}\``).join(',');
          const permiteNullPorAtributo = atributos.map((a) => modelo.rawAttributes[a]?.allowNull !== false);

          for (let i = 0; i < filas.length; i += LOTE) {
            const lote = filas.slice(i, i + LOTE);
            const valores = lote
              .map((fila) => `(${atributos.map((a, idx) => this._escaparValorSql(fila[a], permiteNullPorAtributo[idx])).join(',')})`)
              .join(',\n');
            // REPLACE en vez de INSERT: si por cualquier motivo una fila con la
            // misma clave ya existe (el DELETE de arriba no alcanzo a limpiarla,
            // datos creados entre el export y el import, etc.), la sobrescribe
            // en vez de fallar con "Duplicate entry".
            partes.push(`REPLACE INTO \`${tabla}\` (${columnas}) VALUES\n${valores};`);
          }
        }

        partes.push('');
      } catch (error) {
        // Sin esto, un problema en UNA tabla (columna con un tipo raro, fila
        // corrupta, etc.) tumba el export completo con un mensaje generico y
        // no hay forma de saber cual tabla lo causo.
        error.message = `Error exportando la tabla "${tabla}": ${error.message}`;
        throw error;
      }
    }

    partes.push('SET FOREIGN_KEY_CHECKS=1;');
    return partes.join('\n');
  }

  // Divide un script SQL en sentencias individuales, respetando ';' dentro de
  // strings ('...' o "...", con escape por barra invertida o comilla doblada)
  // para no cortar mal una fila cuyo texto contenga un punto y coma.
  _dividirSentenciasSql(sql) {
    const sentencias = [];
    let actual = '';
    let comilla = null; // "'" o '"' cuando estamos dentro de un string

    for (let i = 0; i < sql.length; i++) {
      const c = sql[i];

      if (comilla) {
        actual += c;
        if (c === '\\') {
          // Caracter escapado: copiar el siguiente tal cual sin evaluarlo.
          i++;
          if (i < sql.length) actual += sql[i];
        } else if (c === comilla) {
          comilla = null;
        }
        continue;
      }

      if (c === "'" || c === '"') {
        comilla = c;
        actual += c;
        continue;
      }

      if (c === '-' && sql[i + 1] === '-') {
        // Comentario de linea: saltar hasta el siguiente salto de linea.
        while (i < sql.length && sql[i] !== '\n') i++;
        continue;
      }

      if (c === ';') {
        if (actual.trim()) sentencias.push(actual.trim());
        actual = '';
        continue;
      }

      actual += c;
    }

    if (actual.trim()) sentencias.push(actual.trim());
    return sentencias;
  }

  // Restaura la base de datos ejecutando un archivo .sql (generado por
  // exportarBaseDatosSql, o cualquier dump compatible con INSERT/DELETE
  // estandar). DESTRUCTIVO e irreversible: se ejecuta tal cual, sentencia por
  // sentencia, dentro de una sola transaccion.
  async importarBaseDatosSql(sqlTexto) {
    if (typeof sqlTexto !== 'string' || !sqlTexto.trim()) {
      throw new Error('El archivo esta vacio o no es un .sql valido.');
    }

    const sentencias = this._dividirSentenciasSql(sqlTexto);
    if (sentencias.length === 0) {
      throw new Error('El archivo no contiene ninguna sentencia SQL para ejecutar.');
    }

    const t = await db.sequelize.transaction();
    try {
      for (const sentencia of sentencias) {
        await db.sequelize.query(sentencia, { transaction: t });
      }
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }

    return { message: 'Base de datos restaurada', sentenciasEjecutadas: sentencias.length };
  }
}

module.exports = ConfigService;
