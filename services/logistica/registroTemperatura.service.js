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

  // Convierte el valor de fecha/hora de una fila a { fecha: 'AAAA-MM-DD', hora: 'HH:mm:ss' } SIN pasar por
  // zonas horarias. Acepta: numero de serie de Excel (46052.925), texto 'AAAA-MM-DD HH:mm:ss',
  // 'M/D/AAAA H:mm[:ss] [AM|PM]' y, como respaldo, lo que entienda `Date`.
  parseDateHora(valor) {
    if (valor === null || valor === undefined || valor === '') return { fecha: null, hora: null };
    const pad = (n) => String(n).padStart(2, '0');

    // Numero de serie de Excel (dias desde 1899-12-30, con la hora como fraccion del dia).
    const esNumero = typeof valor === 'number' || /^\d+(\.\d+)?$/.test(String(valor).trim());
    if (esNumero) {
      const n = Number(valor);
      if (n > 0 && n < 2958466) {
        const dias = Math.floor(n);
        const segundos = Math.round((n - dias) * 86400);
        const f = new Date(Date.UTC(1899, 11, 30) + dias * 86400000);
        const total = segundos >= 86400 ? 86399 : segundos;
        return {
          fecha: `${f.getUTCFullYear()}-${pad(f.getUTCMonth() + 1)}-${pad(f.getUTCDate())}`,
          hora: `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`,
        };
      }
    }

    const texto = String(valor).trim();

    let m = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) {
      return { fecha: `${m[1]}-${pad(m[2])}-${pad(m[3])}`, hora: m[4] !== undefined ? `${pad(m[4])}:${m[5]}:${pad(m[6] || 0)}` : null };
    }

    m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
    if (m) {
      let h = m[4] !== undefined ? Number(m[4]) : null;
      if (h !== null && m[7]) {
        const pm = m[7].toUpperCase() === 'PM';
        if (pm && h < 12) h += 12;
        if (!pm && h === 12) h = 0;
      }
      return { fecha: `${m[3]}-${pad(m[1])}-${pad(m[2])}`, hora: h !== null ? `${pad(h)}:${m[5]}:${pad(m[6] || 0)}` : null };
    }

    // Respaldo: cualquier otro formato que entienda Date (se usan los componentes locales).
    const date = new Date(texto);
    if (!isNaN(date.getTime())) {
      return {
        fecha: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        hora: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
      };
    }
    return { fecha: texto, hora: null };
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

  // Carga masiva de lecturas. Pensada para llamarse por lotes (el front envia ~5.000 filas por peticion):
  //  - primer lote: puede traer `todosSeriales` (seriales de todo el archivo) para revisar de una vez
  //    cuales ya tienen lecturas; si las hay y no llega `modoExistentes`, devuelve requiresConfirmation.
  //  - modoExistentes: 'reemplazar' (borra las lecturas previas de esos seriales, solo en el primer
  //    lote) o 'agregar' (omite las que ya existan: mismo serial, fecha y hora).
  //  - continuacion: true en los lotes siguientes (no revisa ni borra nada).
  async bulkCreate(payload) {
    const serialExterno = payload?.serial ? String(payload.serial).trim() : null;
    const modoExistentes = payload?.modoExistentes || (payload?.allowOverwrite === true ? 'reemplazar' : null);
    const continuacion = payload?.continuacion === true;
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.rows)
        ? payload.rows
        : [];

    if (rows.length === 0) {
      throw boom.badRequest('El archivo no contiene registros para cargar.');
    }

    const serialesFila = rows.map((r) => this._getSerialFromRow(r, serialExterno));
    const serialesUnicos = new Set(serialesFila.filter(Boolean));
    const todos = new Set([...serialesUnicos, ...(Array.isArray(payload?.todosSeriales) ? payload.todosSeriales.map((x) => String(x).trim()).filter(Boolean) : [])]);

    if (todos.size === 0) {
      throw boom.badRequest('No se encontraron seriales en los datos. Asegurate de incluir un serial por fila o uno general.');
    }

    // Una consulta por bloque de seriales (en vez de dos por serial).
    const lista = [...todos];
    const idPorSerial = new Map();
    for (let i = 0; i < lista.length; i += 500) {
      const encontrados = await db.serial_de_articulos.findAll({
        where: { serial: { [Op.in]: lista.slice(i, i + 500) } },
        attributes: ['id', 'serial'],
        raw: true,
      });
      encontrados.forEach((e) => idPorSerial.set(e.serial, e.id));
    }
    const faltantes = lista.filter((x) => !idPorSerial.has(x));
    if (faltantes.length > 0) {
      const muestra = faltantes.slice(0, 20).map((x) => `"${x}"`).join(', ');
      throw boom.badRequest(`Serial(es) no encontrado(s) en la base de datos: ${muestra}${faltantes.length > 20 ? ` y ${faltantes.length - 20} más` : ''}`);
    }

    let overwritten = 0;
    if (!continuacion) {
      const ids = lista.map((x) => idPorSerial.get(x));
      const conteos = await db.RegistroTemperatura.findAll({
        where: { id_serial_articulo: { [Op.in]: ids } },
        attributes: ['id_serial_articulo', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']],
        group: ['id_serial_articulo'],
        raw: true,
      });
      const existentes = conteos.filter((c) => Number(c.total) > 0);

      if (existentes.length > 0 && !modoExistentes) {
        const serialPorId = new Map([...idPorSerial.entries()].map(([sr, id]) => [id, sr]));
        return {
          requiresConfirmation: true,
          serialesConDatos: existentes.map((c) => ({
            serial: serialPorId.get(c.id_serial_articulo),
            registrosExistentes: Number(c.total),
            registrosNuevos: serialesFila.filter((x) => x === serialPorId.get(c.id_serial_articulo)).length,
          })),
          message: `${existentes.length} serial(es) ya tienen lecturas de temperatura cargadas. Elige si deseas reemplazarlas o agregar solo las que no existan.`,
        };
      }

      if (modoExistentes === 'reemplazar' && existentes.length > 0) {
        await db.RegistroTemperatura.destroy({ where: { id_serial_articulo: { [Op.in]: existentes.map((c) => c.id_serial_articulo) } } });
        overwritten = existentes.length;
      }
    }

    // Validacion de filas en memoria
    const errors = [];
    const validos = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const serialStr = serialesFila[i];
      if (!serialStr) {
        errors.push({ fila: i + 1, message: 'Serial requerido en fila' });
        continue;
      }
      const { fecha, hora, temperatura } = this._parseRow(row);
      if (!fecha || !hora || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        errors.push({ fila: i + 1, serial: serialStr, message: 'Fecha/hora invalida', valor: [row['Date/Time'], row.fecha_hora, row.fechaHora, row.dateTime].find((v) => v !== undefined && v !== null) || '' });
        continue;
      }
      if (isNaN(temperatura)) {
        errors.push({ fila: i + 1, serial: serialStr, message: 'Temperatura invalida' });
        continue;
      }
      validos.push({ id_serial_articulo: idPorSerial.get(serialStr), fecha, hora, temperatura });
    }

    // Modo "agregar": omitir lo que ya existe (mismo serial, fecha y hora) y lo repetido dentro del lote.
    let omitidosRepetidos = 0;
    let porInsertar = validos;
    if (modoExistentes === 'agregar' && validos.length > 0) {
      const fechas = validos.map((v) => v.fecha).sort();
      const idsLote = [...new Set(validos.map((v) => v.id_serial_articulo))];
      const yaExisten = await db.RegistroTemperatura.findAll({
        where: {
          id_serial_articulo: { [Op.in]: idsLote },
          fecha: { [Op.between]: [fechas[0], fechas[fechas.length - 1]] },
        },
        attributes: ['id_serial_articulo', 'fecha', 'hora'],
        raw: true,
      });
      const claves = new Set(yaExisten.map((r) => `${r.id_serial_articulo}|${r.fecha}|${r.hora}`));
      porInsertar = [];
      for (const v of validos) {
        const clave = `${v.id_serial_articulo}|${v.fecha}|${v.hora}`;
        if (claves.has(clave)) {
          omitidosRepetidos += 1;
        } else {
          claves.add(clave);
          porInsertar.push(v);
        }
      }
    }

    // Inserciones masivas por bloques dentro de una transaccion.
    let insertados = 0;
    if (porInsertar.length > 0) {
      const transaction = await db.sequelize.transaction();
      try {
        for (let i = 0; i < porInsertar.length; i += 1000) {
          const bloque = porInsertar.slice(i, i + 1000);
          await db.RegistroTemperatura.bulkCreate(bloque, { validate: false, transaction });
          insertados += bloque.length;
        }
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw boom.badRequest(`No se pudo guardar el lote: ${err.message}`);
      }
    }

    const MAX_DETALLE = 200;
    return {
      message: `Carga completada. ${insertados} exitosos, ${errors.length} errores${omitidosRepetidos ? `, ${omitidosRepetidos} repetidos omitidos` : ''}.`,
      total: insertados,
      errors: errors.length,
      omitidosRepetidos,
      overwritten,
      errorDetails: errors.slice(0, MAX_DETALLE),
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
       GROUP BY rt.id_serial_articulo, sa.serial, sa.id_contenedor, c.contenedor, l.id_lugar_de_llenado, a.nombre, l.fecha
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
                  { model: db.Buque },
                  { model: db.semanas }
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
        // La inspeccion de vacio (zona 'Inspeccion vacio') no es antinarcoticos: se excluye.
        // Las filas sin zona se conservan (el operador NE de SQL descartaria los NULL).
        where: {
          id_contenedor: result.contenedor.id,
          [Op.or]: [{ zona: { [Op.ne]: 'Inspeccion vacio' } }, { zona: null }],
        },
        attributes: ['fecha_inspeccion', 'hora_inicio', 'hora_fin', 'agente', 'zona'],
        order: [['fecha_inspeccion', 'DESC']],
      });
      result.contenedor.inspecciones = inspecciones.map((i) => i.toJSON());
    }

    return result;
  }
}

module.exports = RegistroTemperaturaService;
