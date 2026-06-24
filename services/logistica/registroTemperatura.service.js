const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class RegistroTemperaturaService {
  async create(data) {
    try {
      return await db.RegistroTemperatura.create(data);
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el registro de temperatura');
    }
  }

  async find() {
    return db.RegistroTemperatura.findAll({
      include: this.includeOptions()
    });
  }

  async findOne(id) {
    const registro = await db.RegistroTemperatura.findByPk(id, {
      include: this.includeOptions()
    });
    if (!registro) {
      throw boom.notFound('El registro de temperatura no existe');
    }
    return registro;
  }

  async update(id, changes) {
    const registro = await db.RegistroTemperatura.findByPk(id);
    if (!registro) {
      throw boom.notFound('El registro de temperatura no existe');
    }
    await db.RegistroTemperatura.update(changes, { where: { id } });
    return { message: 'Registro de temperatura actualizado', id, changes };
  }

  async delete(id) {
    const registro = await db.RegistroTemperatura.findByPk(id);
    if (!registro) {
      throw boom.notFound('El registro de temperatura no existe');
    }
    await db.RegistroTemperatura.destroy({ where: { id } });
    return { message: 'Registro de temperatura eliminado', id };
  }

  parseDateHora(fechaHoraStr) {
    if (!fechaHoraStr) return { fecha: null, hora: null };

    const cleaned = String(fechaHoraStr).trim();
    const date = new Date(cleaned);

    if (!isNaN(date.getTime())) {
      const fecha = date.toISOString().split('T')[0];
      const hora = date.toTimeString().split(' ')[0];
      return { fecha, hora };
    }

    const parts = cleaned.split(' ');
    if (parts.length >= 2) {
      const fechaParts = parts[0].split('/');
      if (fechaParts.length === 3) {
        const month = fechaParts[0].padStart(2, '0');
        const day = fechaParts[1].padStart(2, '0');
        const year = fechaParts[2];
        return { fecha: `${year}-${month}-${day}`, hora: parts[1] };
      }
      return { fecha: parts[0], hora: parts[1] };
    }

    return { fecha: cleaned, hora: null };
  }

  _getSerialFromRow(row, serialExterno) {
    return serialExterno || String(row.serial || row.serial_de_articulo || '').trim() || null;
  }

  _parseRow(row) {
    const fechaHora = row.fecha_hora || row.fechaHora || row['Date/Time'] || row.dateTime || '';
    const { fecha, hora } = this.parseDateHora(fechaHora);
    const temperatura = parseFloat(
      row.temperatura
      || row.Temperature
      || row['Sensor 1: Ambient Temperature(°C)']
      || row['Ambient Temperature']
      || row.temp
    );
    return { fecha, hora, temperatura };
  }

  async bulkCreate(payload) {
    const serialExterno = payload?.serial ? String(payload.serial).trim() : null;
    const allowOverwrite = payload?.allowOverwrite === true;
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.rows)
        ? payload.rows
        : [];

    if (rows.length === 0) {
      throw boom.badRequest('El archivo no contiene registros para cargar.');
    }

    const serialesUnicos = new Set();
    for (const row of rows) {
      const s = this._getSerialFromRow(row, serialExterno);
      if (s) serialesUnicos.add(s);
    }

    if (serialesUnicos.size === 0) {
      throw boom.badRequest('No se encontraron seriales en los datos. Asegurate de incluir un serial por fila o uno general.');
    }

    const serialMap = new Map();
    for (const serialStr of serialesUnicos) {
      const found = await db.serial_de_articulos.findOne({ where: { serial: serialStr } });
      if (!found) {
        serialMap.set(serialStr, { error: `Serial "${serialStr}" no encontrado en la base de datos` });
      } else {
        const existingCount = await db.RegistroTemperatura.count({ where: { id_serial_articulo: found.id } });
        serialMap.set(serialStr, { serial: found, existingCount });
      }
    }

    const serialesConError = [...serialMap.entries()].filter(([, v]) => v.error);
    if (serialesConError.length > 0) {
      const errMsg = serialesConError.map(([s, v]) => v.error).join('; ');
      throw boom.badRequest(errMsg);
    }

    const serialesConDatos = [...serialMap.entries()].filter(([, v]) => v.existingCount > 0);

    if (serialesConDatos.length > 0 && !allowOverwrite) {
      return {
        requiresConfirmation: true,
        serialesConDatos: serialesConDatos.map(([serial, v]) => ({
          serial,
          registrosExistentes: v.existingCount,
          registrosNuevos: rows.filter((r) => this._getSerialFromRow(r, serialExterno) === serial).length
        })),
        message: `Los siguientes seriales ya tienen registros de temperatura cargados: ${serialesConDatos.map(([s]) => s).join(', ')}. ¿Deseas reemplazarlos?`
      };
    }

    if (allowOverwrite && serialesConDatos.length > 0) {
      const ids = serialesConDatos.map(([, v]) => v.serial.id);
      await db.RegistroTemperatura.destroy({ where: { id_serial_articulo: { [Op.in]: ids } } });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const serialStr = this._getSerialFromRow(row, serialExterno);
      if (!serialStr) {
        errors.push({ fila: i + 1, message: 'Serial requerido en fila', ...row });
        continue;
      }

      const entry = serialMap.get(serialStr);
      if (!entry || entry.error) {
        errors.push({ fila: i + 1, serial: serialStr, message: 'Serial no disponible' });
        continue;
      }

      const { fecha, hora, temperatura } = this._parseRow(row);

      if (!fecha || !hora) {
        errors.push({ fila: i + 1, serial: serialStr, message: 'Fecha/hora invalida', ...row });
        continue;
      }

      if (isNaN(temperatura)) {
        errors.push({ fila: i + 1, serial: serialStr, message: 'Temperatura invalida', ...row });
        continue;
      }

      try {
        await db.RegistroTemperatura.create({
          id_serial_articulo: entry.serial.id,
          fecha,
          hora,
          temperatura
        });
        results.push({ fila: i + 1, serial: serialStr, status: 'ok' });
      } catch (err) {
        errors.push({ fila: i + 1, serial: serialStr, message: err.message });
      }
    }

    return {
      message: `Carga completada. ${results.length} exitosos, ${errors.length} errores.`,
      total: results.length,
      errors: errors.length,
      overwritten: serialesConDatos.length,
      errorDetails: errors
    };
  }

  async bulkUpdate(payload) {
    const updatesArray = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.rows)
        ? payload.rows
        : [];
    const allowPartial = Boolean(payload?.allowPartial);

    if (updatesArray.length === 0) {
      throw boom.badRequest('El archivo no contiene registros para actualizar.');
    }

    const results = [];
    const missingRows = [];
    let updated = 0;

    for (let i = 0; i < updatesArray.length; i++) {
      const row = updatesArray[i];
      const serialStr = String(row.serial || row.serial_de_articulo || '').trim();
      const fecha = row.fecha;
      const hora = row.hora;

      if (!serialStr || !fecha || !hora) {
        missingRows.push({
          ...row,
          reason: 'Serial, fecha y hora son requeridos para la actualizacion'
        });
        continue;
      }

      const serial = await db.serial_de_articulos.findOne({
        where: { serial: serialStr }
      });

      if (!serial) {
        missingRows.push({
          ...row,
          serial: serialStr,
          reason: `Serial ${serialStr} no encontrado`
        });
        continue;
      }

      const record = await db.RegistroTemperatura.findOne({
        where: {
          id_serial_articulo: serial.id,
          fecha,
          hora
        }
      });

      if (!record) {
        missingRows.push({
          ...row,
          serial: serialStr,
          reason: `Registro no encontrado para serial ${serialStr}, fecha ${fecha}, hora ${hora}`
        });
        continue;
      }

      const changes = {};
      if (row.temperatura !== undefined) changes.temperatura = row.temperatura;
      if (row.fecha) changes.fecha = row.fecha;
      if (row.hora) changes.hora = row.hora;
      if (Object.keys(changes).length > 0) {
        await record.update(changes);
        updated++;
      }
    }

    if (!allowPartial && missingRows.length > 0) {
      return {
        requiresConfirmation: true,
        processableCount: results.length + updated,
        missingCount: missingRows.length,
        missingRows
      };
    }

    return {
      message: `Actualizacion completada. ${updated} actualizados, ${missingRows.length} no encontrados.`,
      total: updated,
      partial: missingRows.length > 0,
      missingCount: missingRows.length
    };
  }

  includeOptions() {
    return [
      {
        model: db.serial_de_articulos,
        as: 'serial',
        include: [
          {
            model: db.Contenedor,
            as: 'contenedor',
            include: [
              {
                model: db.Listado,
                order: [['createdAt', 'ASC'], ['id', 'ASC']],
                limit: 1,
                include: [
                  { model: db.combos },
                  { model: db.almacenes, as: 'almacen' },
                  { model: db.Embarque }
                ]
              }
            ]
          }
        ]
      }
    ];
  }

  async paginate(offset, limit, body = {}) {
    const parsedLimit = parseInt(limit, 10) || 25;
    const page = parseInt(offset, 10) || 1;
    const parsedOffset = (page - 1) * parsedLimit;

    const where = {};
    if (body.id_serial_articulo) {
      where.id_serial_articulo = body.id_serial_articulo;
    }
    if (body.fecha) {
      where.fecha = body.fecha;
    }
    if (body.fecha_inicio || body.fecha_fin) {
      where.fecha = {};
      if (body.fecha_inicio) where.fecha[Op.gte] = body.fecha_inicio;
      if (body.fecha_fin) where.fecha[Op.lte] = body.fecha_fin;
    }

    const includeOptions = this.includeOptions();

    if (body.serial) {
      includeOptions[0].where = {
        serial: { [Op.like]: `%${body.serial}%` }
      };
      includeOptions[0].required = true;
    }

    const { count, rows } = await db.RegistroTemperatura.findAndCountAll({
      where,
      limit: parsedLimit,
      offset: parsedOffset,
      order: [['fecha', 'DESC'], ['hora', 'DESC'], ['id', 'DESC']],
      include: includeOptions
    });

    return { data: rows, total: count };
  }

  async paginarResumen(offset, limit, body = {}) {
    const parsedLimit = parseInt(limit, 10) || 25;
    const page = parseInt(offset, 10) || 1;
    const parsedOffset = (page - 1) * parsedLimit;

    const serialFilter = body.serial ? `WHERE sa.serial LIKE :serial` : '';

    const countResult = await db.sequelize.query(
      `SELECT COUNT(DISTINCT rt.id_serial_articulo) as total
       FROM RegistroTemperaturas rt
       JOIN serial_de_articulos sa ON rt.id_serial_articulo = sa.id
       ${serialFilter}`,
      {
        replacements: { serial: `%${body.serial}%` },
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    const rows = await db.sequelize.query(
      `SELECT
         rt.id_serial_articulo,
         sa.serial,
         sa.id_contenedor,
         c.contenedor as contenedor_nombre,
         l.id_lugar_de_llenado,
         a.nombre as lugar_llenado,
         l.fecha as fecha_llenado,
         COUNT(rt.id) as lecturas,
         MIN(CONCAT(rt.fecha, ' ', rt.hora)) as primera_lectura,
         MAX(CONCAT(rt.fecha, ' ', rt.hora)) as ultima_lectura
       FROM RegistroTemperaturas rt
       JOIN serial_de_articulos sa ON rt.id_serial_articulo = sa.id
       LEFT JOIN Contenedors c ON sa.id_contenedor = c.id
       LEFT JOIN (
         SELECT id_contenedor, MIN(id) as min_id
         FROM Listados
         GROUP BY id_contenedor
       ) l_first ON c.id = l_first.id_contenedor
       LEFT JOIN Listados l ON l_first.min_id = l.id
       LEFT JOIN almacenes a ON l.id_lugar_de_llenado = a.id
       ${serialFilter}
       GROUP BY rt.id_serial_articulo
       ORDER BY MAX(CONCAT(rt.fecha, ' ', rt.hora)) DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { serial: `%${body.serial}%`, limit: parsedLimit, offset: parsedOffset },
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    return { data: rows, total: countResult[0]?.total || 0 };
  }

  async getLecturas(idSerialArticulo) {
    return db.RegistroTemperatura.findAll({
      where: { id_serial_articulo: idSerialArticulo },
      order: [['fecha', 'ASC'], ['hora', 'ASC']],
      attributes: ['id', 'fecha', 'hora', 'temperatura']
    });
  }

  async getContextoSerial(idSerialArticulo) {
    const serial = await db.serial_de_articulos.findByPk(idSerialArticulo, {
      include: [
        {
          association: 'contenedor',
          include: [
            {
              model: db.Listado,
              include: [
                { model: db.Embarque, include: [
                  { model: db.Destino },
                  { model: db.Naviera },
                  { model: db.clientes },
                  { model: db.Buque }
                ]},
                { model: db.almacenes, as: 'almacen' },
                { model: db.combos }
              ]
            }
          ]
        }
      ]
    });
    if (!serial) throw boom.notFound('Serial no encontrado');

    const result = serial.toJSON();
    if (result.contenedor?.id) {
      const inspecciones = await db.Inspeccion.findAll({
        where: { id_contenedor: result.contenedor.id },
        attributes: ['fecha_inspeccion', 'hora_inicio', 'hora_fin', 'agente', 'zona'],
        order: [['fecha_inspeccion', 'DESC']],
      });
      result.contenedor.inspecciones = inspecciones.map((i) => i.toJSON());
    }

    return result;
  }
}

module.exports = RegistroTemperaturaService;
