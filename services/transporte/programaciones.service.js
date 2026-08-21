const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');
const { normalizeRole, ROLES } = require('../../middlewares/auth.handler');
const { toColombiaDate, toColombiaIso } = require('../../utils/dates');

const ESTADO_LISTADO_PENDIENTE = 'pendiente';
const ESTADO_LISTADO_ACTUALIZADO = 'actualizado';


class ProgramacionService {
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

  async isVehiculoSinCombustible(vehiculoId) {
    if (!vehiculoId) {
      return false;
    }
    const vehiculosSinCombustible = await this.getVehiculosSinCombustibleSet();
    return vehiculosSinCombustible.has(String(vehiculoId));
  }

  async getAllowedTransportadoras(user) {
    if (!user?.username || normalizeRole(user.id_rol) === ROLES.SUPER_ADMIN) {
      return null;
    }

    const asignaciones = await db.transportadoras_por_usuario.findAll({
      where: { username: user.username, habilitado: true },
    });

    return asignaciones.map((item) => item.id_transportadora);
  }

  async getTransportadoraWhere(body = {}, user = null) {
    const allowed = await this.getAllowedTransportadoras(user);
    const requestedIds = [];

    if (body.transportadoraId) {
      requestedIds.push(body.transportadoraId);
    }

    if (Array.isArray(body.transportadoraIds)) {
      requestedIds.push(...body.transportadoraIds);
    }

    const normalizedRequested = [...new Set(
      requestedIds
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item))
    )];

    if (Array.isArray(allowed)) {
      const allowedIds = allowed.map((item) => Number(item)).filter((item) => Number.isFinite(item));
      const finalIds = normalizedRequested.length
        ? normalizedRequested.filter((item) => allowedIds.includes(item))
        : allowedIds;

      return { transportadoraId: { [Op.in]: finalIds.length ? finalIds : [-1] } };
    }

    if (normalizedRequested.length) {
      return { transportadoraId: { [Op.in]: normalizedRequested } };
    }

    return {};
  }

  normalizeText(value) {
    return String(value || '').trim();
  }

  async validateTipoMovimiento(data, fallback = {}) {
    const movimiento = this.normalizeText(
      Object.prototype.hasOwnProperty.call(data || {}, 'movimiento')
        ? data?.movimiento
        : fallback?.movimiento
    );

    if (!movimiento) {
      throw boom.badRequest('El movimiento es obligatorio');
    }

    const tipoMovimiento = await db.tipo_movimiento_vehiculos.findOne({
      where: { movimiento },
    });

    if (!tipoMovimiento) {
      throw boom.notFound(`El tipo de movimiento "${movimiento}" no existe`);
    }

    const contenedor = this.normalizeText(
      Object.prototype.hasOwnProperty.call(data || {}, 'contenedor')
        ? data?.contenedor
        : fallback?.contenedor
    );

    if (tipoMovimiento.requiere_contenedor && !contenedor) {
      throw boom.badRequest(`El movimiento ${movimiento} requiere numero de contenedor`);
    }

    return tipoMovimiento;
  }

  getLiquidatedBalance(record) {
    if (!record) {
      return null;
    }

    if (record.stock_real != null && record.stock_real !== '') {
      return Number(record.stock_real);
    }

    if (record.stock_final != null && record.stock_final !== '') {
      return Number(record.stock_final);
    }

    return null;
  }

  normalizeDate(value) {
    if (!value) {
      return '';
    }

    const text = String(value).trim();
    const exactMatch = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (exactMatch) {
      return exactMatch[1];
    }

    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getLastLiquidatedRecordByVehicle(vehiculoId) {
    if (!vehiculoId) {
      return null;
    }

    return db.record_consumos.findOne({
      where: {
        vehiculo_id: String(vehiculoId),
        liquidado: true,
      },
      order: [['fecha', 'DESC'], ['id', 'DESC']],
    });
  }

  async validateFechaPosteriorALiquidacion(vehiculoId, fecha) {
    const normalizedFecha = this.normalizeDate(fecha);
    if (!vehiculoId || !normalizedFecha) {
      return null;
    }

    const lastLiquidatedRecord = await this.getLastLiquidatedRecordByVehicle(vehiculoId);
    const lastLiquidatedDate = this.normalizeDate(lastLiquidatedRecord?.fecha);

    if (lastLiquidatedDate && normalizedFecha < lastLiquidatedDate) {
      throw boom.conflict(`No se puede programar el vehiculo en ${normalizedFecha} porque su ultima fecha liquidada es ${lastLiquidatedDate}`);
    }

    return lastLiquidatedRecord;
  }

  async validateSaldoConsistenteConUltimaLiquidacion(vehiculoId) {
    if (!vehiculoId) {
      return null;
    }

    const [vehiculo, lastLiquidatedRecord] = await Promise.all([
      db.vehiculo.findOne({ where: { id: String(vehiculoId) } }),
      this.getLastLiquidatedRecordByVehicle(vehiculoId),
    ]);

    if (!vehiculo || !lastLiquidatedRecord) {
      return null;
    }

    const saldoLiquidado = this.getLiquidatedBalance(lastLiquidatedRecord);
    if (saldoLiquidado == null || Number.isNaN(saldoLiquidado)) {
      return null;
    }

    const lastTanqueo = await db.tanqueos.findOne({
      where: { vehiculo_id: String(vehiculoId) },
      order: [['fecha', 'DESC'], ['id', 'DESC']],
    });

    const lastLiquidatedDate = this.normalizeDate(lastLiquidatedRecord.fecha);
    const lastTanqueoDate = this.normalizeDate(lastTanqueo?.fecha);
    const saldoBase = lastTanqueoDate && lastLiquidatedDate && lastTanqueoDate >= lastLiquidatedDate
      ? Number(lastTanqueo?.saldo_nuevo ?? saldoLiquidado)
      : saldoLiquidado;

    if (saldoBase == null || Number.isNaN(saldoBase)) {
      return null;
    }

    const saldoActual = Number(vehiculo.combustible || 0);
    if (Math.abs(saldoActual - saldoBase) > 0.0001) {
      throw boom.conflict(`El vehiculo ${vehiculo.placa || vehiculo.id} tiene un descuadre de saldo. Saldo actual: ${saldoActual.toFixed(2)}. Ultimo saldo conciliado: ${saldoBase.toFixed(2)} con fecha ${lastTanqueoDate && lastTanqueoDate >= lastLiquidatedDate ? lastTanqueoDate : lastLiquidatedDate}`);
    }

    return lastLiquidatedRecord;
  }

  async validateBl(bl) {
    if (!bl) {
      return null;
    }

    const embarque = await db.Embarque.findOne({ where: { bl } });
    if (!embarque) {
      throw boom.notFound(`El BL ${bl} no existe en embarques`);
    }

    return embarque;
  }

  getProgramacionSerialesInclude() {
    return {
      model: db.programacion_serial,
      as: 'seriales_programador',
      separate: true,
      include: [
        {
          model: db.serial_de_articulos,
          as: 'serial_articulo',
          include: [
            { model: db.productos, as: 'producto' },
            { model: db.Contenedor, as: 'contenedor' }
          ]
        },
        { model: db.Contenedor, as: 'contenedor' },
        { model: db.MotivoDeUso, as: 'motivo_de_uso' }
      ]
    };
  }

  // Registra en programacion_historial quien hizo un cambio, cuando (fecha del
  // servidor, se muestra en hora Colombia en el frontend) y el estado antes/despues.
  async registrarHistorial({ programacion_id, accion, usuario, datosAnteriores, datosNuevos, referencia }) {
    try {
      const ref = referencia || datosNuevos || datosAnteriores || {};
      await db.programacion_historial.create({
        programacion_id,
        accion,
        usuario: usuario || null,
        contenedor: ref.contenedor || null,
        bl: ref.bl || null,
        semana: ref.semana || null,
        datos_anteriores: datosAnteriores || null,
        datos_nuevos: datosNuevos || null,
      });
    } catch (error) {
      // No se debe romper la operacion principal si falla el registro de historial.
      console.error('No se pudo registrar el historial de programacion:', error?.message);
    }
  }

  async create(data, usuario = null) {
    await this.validateBl(data?.bl);
    const tipoMovimiento = await this.validateTipoMovimiento(data);
    const vehiculoSinCombustible = await this.isVehiculoSinCombustible(data?.vehiculo_id);
    if (!vehiculoSinCombustible) {
      await this.validateFechaPosteriorALiquidacion(data?.vehiculo_id, data?.fecha);
      await this.validateSaldoConsistenteConUltimaLiquidacion(data?.vehiculo_id);
    }
    const body = {
      ...data,
      movimiento_id: tipoMovimiento.id,
      eliminado: false,
      estado_listado: data?.estado_listado || ESTADO_LISTADO_PENDIENTE,
    }
    const creado = await db.programacion.create(body);

    await this.registrarHistorial({
      programacion_id: creado.id,
      accion: 'creado',
      usuario,
      datosAnteriores: null,
      datosNuevos: creado.toJSON(),
    });

    return creado;
  }


  async find() {
    return await db.programacion.findAll({
      include: [
        { model: db.productos_viajes },
        this.getProgramacionSerialesInclude(),
        { model: db.conductores, as: 'conductor' },
        { model: db.rutas, include: [{ model: db.ubicaciones, as: 'ubicacion_1' }, { model: db.ubicaciones, as: 'ubicacion_2' }] },
        { model: db.clientes },
      ]
    });
  }

  async findOne(id) {
    const item = await db.programacion.findOne({
      where: { id },
      include: [
        { model: db.productos_viajes },
        this.getProgramacionSerialesInclude(),
      ]
    });
    if (!item) {
      throw boom.notFound('El item no existe');
    }
    return item;
  }

  async update(id, changes, usuario = null) {
    const item = await db.programacion.findOne({ where: { id } });
    if (!item) {
      throw boom.notFound('El item no existe');
    }

    // Solo validar BL si el campo viene en el patch y tiene valor
    if ('bl' in changes && changes.bl) {
      await this.validateBl(changes.bl);
    }

    // Solo validar tipo de movimiento si se está cambiando movimiento o contenedor
    const movimientoOContenedorCambian = 'movimiento' in changes || 'contenedor' in changes;
    let tipoMovimiento = null;
    if (movimientoOContenedorCambian) {
      tipoMovimiento = await this.validateTipoMovimiento(changes, item);
    }

    // Solo validar fecha/combustible si cambia el vehículo o la fecha
    const vehiculoOFechaCambian = 'vehiculo_id' in changes || 'fecha' in changes;
    if (vehiculoOFechaCambian) {
      const vehiculoId = changes?.vehiculo_id || item?.vehiculo_id;
      const fecha = 'fecha' in changes ? changes.fecha : item?.fecha;
      const vehiculoSinCombustible = await this.isVehiculoSinCombustible(vehiculoId);
      if (!vehiculoSinCombustible) {
        await this.validateFechaPosteriorALiquidacion(vehiculoId, fecha);
        await this.validateSaldoConsistenteConUltimaLiquidacion(vehiculoId);
      }
    }

    const datosAnteriores = item.toJSON();

    const nextChanges = { ...changes };
    if (!Object.prototype.hasOwnProperty.call(nextChanges, 'estado_listado')) {
      nextChanges.estado_listado = ESTADO_LISTADO_PENDIENTE;
    }
    // Solo se toca movimiento_id cuando el texto de movimiento realmente
    // cambio (no cuando el unico cambio en este patch fue el contenedor).
    if ('movimiento' in changes && tipoMovimiento) {
      nextChanges.movimiento_id = tipoMovimiento.id;
    }
    await db.programacion.update(nextChanges, { where: { id } });

    const actualizado = await db.programacion.findOne({ where: { id } });
    await this.registrarHistorial({
      programacion_id: id,
      accion: 'editado',
      usuario,
      datosAnteriores,
      datosNuevos: actualizado ? actualizado.toJSON() : { ...datosAnteriores, ...nextChanges },
    });

    // El estado_listado es por grupo (mismo contenedor+fecha), no por linea:
    // la sincronizacion hacia Listado compite por las mismas lineas de
    // Listado entre todas las lineas del grupo, asi que deben compartir el
    // mismo estado. Si esta linea queda pendiente, todas las hermanas quedan
    // pendientes; si esta linea queda actualizada (toggle manual del Super
    // Admin), todas las hermanas quedan actualizadas tambien.
    // Se sincroniza tanto el grupo nuevo (por si cambio contenedor/fecha)
    // como el viejo (que ahora tiene una linea menos).
    await this.sincronizarEstadoHermanos(item.contenedor, item.fecha, nextChanges.estado_listado, id);
    if (actualizado && (actualizado.contenedor !== item.contenedor || actualizado.fecha !== item.fecha)) {
      await this.sincronizarEstadoHermanos(actualizado.contenedor, actualizado.fecha, nextChanges.estado_listado, id);
    }

    return { message: "El item fue actualizado", id };
  }

  async sincronizarEstadoHermanos(contenedor, fecha, estadoListado, excludeId) {
    if (!contenedor || !fecha || !estadoListado) return;
    await db.programacion.update(
      { estado_listado: estadoListado },
      {
        where: {
          contenedor,
          fecha,
          id: { [Op.ne]: excludeId },
        },
      }
    );
  }

  async marcarHermanosPendientes(contenedor, fecha, excludeId) {
    if (!contenedor || !fecha) return;
    await db.programacion.update(
      { estado_listado: ESTADO_LISTADO_PENDIENTE },
      {
        where: {
          contenedor,
          fecha,
          id: { [Op.ne]: excludeId },
          estado_listado: { [Op.ne]: ESTADO_LISTADO_PENDIENTE },
        },
      }
    );
  }

  async bulkUpdate(rows = [], usuario = null) {
    const errors = [];
    let processed = 0;
    for (const row of rows) {
      try {
        const { id, ...changes } = row;
        if (!id) throw new Error('Falta el campo id');
        await this.update(id, changes, usuario);
        processed += 1;
      } catch (e) {
        errors.push({ id: row?.id, error: e?.message || 'Error desconocido' });
      }
    }
    return { processed, total: rows.length, errors };
  }

  async delete(id, usuario = null) {
    const existe = await db.programacion.findOne({ where: { id } });
    if (!existe) {
      throw boom.notFound('El item no existe');
    }

    await this.registrarHistorial({
      programacion_id: id,
      accion: 'eliminado',
      usuario,
      datosAnteriores: existe.toJSON(),
      datosNuevos: null,
    });

    await db.programacion.destroy({ where: { id } });

    // Si quedan otras lineas del mismo contenedor+fecha ya sincronizadas, las
    // regresa a pendiente: al eliminar esta linea puede sobrar una linea en
    // Listado (o cambiar cuantas hacen falta), y "Actualizar pendientes" solo
    // revisa contenedores/fechas con lineas en estado pendiente.
    await this.marcarHermanosPendientes(existe.contenedor, existe.fecha, id);

    return { message: "El item fue eliminado", id };
  }

  async getForExcel({ semana, fechaInicio, fechaFin, transportadoraId } = {}) {
    const where = { eliminado: false };

    if (semana) where.semana = semana;

    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha[Op.gte] = fechaInicio;
      if (fechaFin) {
        const d = new Date(fechaFin + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + 1);
        where.fecha[Op.lt] = d.toISOString().split('T')[0];
      }
    }

    const vehiculoWhere = transportadoraId
      ? { transportadoraId: Number(transportadoraId) }
      : {};

    const rows = await db.programacion.findAll({
      where,
      order: [['fecha', 'ASC'], ['bl', 'ASC'], ['id', 'ASC']],
      include: [
        { model: db.conductores, as: 'conductor' },
        { model: db.clientes },
        {
          model: db.vehiculo,
          required: Object.keys(vehiculoWhere).length > 0,
          ...(Object.keys(vehiculoWhere).length ? { where: vehiculoWhere } : {}),
          include: [{ model: db.transportadoras, as: 'transportadora' }],
        },
        {
          model: db.rutas,
          include: [
            { model: db.ubicaciones, as: 'ubicacion_1' },
            { model: db.ubicaciones, as: 'ubicacion_2' },
          ],
        },
      ],
    });

    // ── Lookup id_contenedor + hora_revision_puerto via listado ──────────────
    const uniqueCodes = [...new Set(rows.map((r) => r.contenedor).filter(Boolean))];
    const uniqueSemanas = [...new Set(rows.map((r) => r.semana).filter(Boolean))];

    // key: `${contenedor_code}|${semana_consecutivo}` → { id, hora_revision_puerto }
    const contenedorMap = new Map();

    if (uniqueCodes.length && uniqueSemanas.length) {
      const listadoRows = await db.Listado.findAll({
        attributes: ['id_contenedor'],
        include: [
          {
            model: db.Contenedor,
            where: { contenedor: { [Op.in]: uniqueCodes } },
            attributes: ['id', 'contenedor', 'hora_revision_puerto', 'latitud_revision_puerto', 'longitud_revision_puerto'],
            required: true,
          },
          {
            model: db.Embarque,
            attributes: [],
            required: true,
            include: [{
              model: db.semanas,
              where: { consecutivo: { [Op.in]: uniqueSemanas } },
              attributes: ['consecutivo'],
              required: true,
            }],
          },
        ],
      });

      for (const lr of listadoRows) {
        const code = lr.Contenedor?.contenedor;
        const sem = lr.Embarque?.semana?.consecutivo;
        if (code && sem) {
          contenedorMap.set(`${code}|${sem}`, {
            id: lr.Contenedor.id,
            hora_revision_puerto: lr.Contenedor.hora_revision_puerto,
            latitud_revision_puerto: lr.Contenedor.latitud_revision_puerto,
            longitud_revision_puerto: lr.Contenedor.longitud_revision_puerto,
          });
        }
      }
    }

    return rows.map((row) => {
      const entry = contenedorMap.get(`${row.contenedor}|${row.semana}`) || null;
      return {
        id: row.id,
        fecha: toColombiaDate(row.fecha) || row.fecha || '',
        semana: row.semana || '',
        bl: row.bl || '',
        contenedor: row.contenedor || '',
        id_contenedor: entry?.id ?? null,
        movimiento: row.movimiento || '',
        conductor: row.conductor?.conductor || '',
        vehiculo: row.vehiculo?.placa || '',
        transportadora: row.vehiculo?.transportadora?.razon_social || '',
        origen: row.ruta?.ubicacion_1?.ubicacion || '',
        destino: row.ruta?.ubicacion_2?.ubicacion || '',
        cliente: row.clientes?.razon_social || '',
        estado_listado: row.estado_listado || '',
        llegada_origen: row.llegada_origen || '',
        salida_origen: row.salida_origen || '',
        llegada_patio: row.llegada_patio || '',
        retiro_patio: row.retiro_patio || '',
        llegada_destino: row.llegada_destino || '',
        salida_destino: row.salida_destino || '',
        cierre: row.cierre || '',
        hora_revision_puerto: entry ? (toColombiaIso(entry.hora_revision_puerto) || '') : '',
        latitud_revision_puerto: entry?.latitud_revision_puerto ?? '',
        longitud_revision_puerto: entry?.longitud_revision_puerto ?? '',
        creado_en: toColombiaIso(row.createdAt) || '',
        actualizado_en: toColombiaIso(row.updatedAt) || '',
      };
    });
  }

  async paginate(offset, limit, body, user = null) {
    // Desectructurar para no mutar el objeto recibido
    const { fechaFin, ...restBody } = body || {};

    const nextDateStr = (dateStr) => {
      const d = new Date(dateStr + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + 1);
      return d.toISOString().split('T')[0];
    };

    let fecha;
    if (fechaFin && restBody?.fecha) {
      fecha = { [Op.gte]: restBody.fecha, [Op.lt]: nextDateStr(fechaFin) };
    } else if (fechaFin) {
      fecha = { [Op.lt]: nextDateStr(fechaFin) };
    } else if (restBody?.fecha) {
      fecha = { [Op.gte]: restBody.fecha };
    }

    const vehiculoTransportadoraWhere = await this.getTransportadoraWhere(restBody, user);

    const whereCondition = {};

    // Usar igualdad exacta cuando hay valor; omitir el filtro si está vacío
    if (restBody?.semana) whereCondition.semana = restBody.semana;
    if (Array.isArray(restBody?.movimiento) && restBody.movimiento.length > 0) {
      whereCondition.movimiento = { [Op.in]: restBody.movimiento };
    } else if (typeof restBody?.movimiento === 'string' && restBody.movimiento) {
      whereCondition.movimiento = restBody.movimiento;
    }
    if (fecha) whereCondition.fecha = fecha;
    if (restBody?.bl) whereCondition.bl = { [Op.like]: `%${restBody.bl}%` };
    if (restBody?.estado_listado) whereCondition.estado_listado = restBody.estado_listado;
    if (restBody?.eliminado) whereCondition.eliminado = restBody.eliminado;

    const conductorWhere = restBody?.conductor
      ? { conductor: { [Op.like]: `%${restBody.conductor}%` } }
      : {};

    const vehiculoWhere = {
      ...(restBody?.vehiculo ? { placa: { [Op.like]: `%${restBody.vehiculo}%` } } : {}),
      ...vehiculoTransportadoraWhere,
    };

    const rutaWhere = {};
    if (restBody?.ubicacion1) rutaWhere.ubicacion1 = restBody.ubicacion1;
    if (restBody?.ubicacion2) rutaWhere.ubicacion2 = restBody.ubicacion2;

    const baseClause = {
      where: whereCondition,
      order: [['fecha', 'DESC'], ['bl', 'ASC'], ['contenedor', 'ASC'], ['id', 'ASC']],
      distinct: true,
      subQuery: false,
      include: [
        {
          model: db.rutas,
          include: [
            { model: db.ubicaciones, as: 'ubicacion_1' },
            { model: db.ubicaciones, as: 'ubicacion_2' },
            { model: db.galones_por_ruta },
          ],
          ...(Object.keys(rutaWhere).length ? { where: rutaWhere } : {}),
        },
        { model: db.productos_viajes },
        this.getProgramacionSerialesInclude(),
        {
          model: db.conductores,
          as: 'conductor',
          ...(Object.keys(conductorWhere).length ? { where: conductorWhere } : {}),
        },
        { model: db.clientes },
        {
          model: db.vehiculo,
          include: [{ model: db.transportadoras, as: 'transportadora' }],
          ...(Object.keys(vehiculoWhere).length ? { where: vehiculoWhere } : {}),
        },
      ],
    };

    const pageClause = { ...baseClause };
    if (offset && limit) {
      const newLimit = parseInt(limit, 10);
      const newOffset = (parseInt(offset, 10) - 1) * newLimit;
      pageClause.limit = newLimit;
      pageClause.offset = newOffset;
    }

    // count usa baseClause sin limit/offset para obtener el total real
    const [result, count, distinctContenedores] = await Promise.all([
      db.programacion.findAll(pageClause),
      db.programacion.count(baseClause),
      db.programacion.count({
        col: 'contenedor',
        distinct: true,
        where: { ...whereCondition, contenedor: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } },
        include: baseClause.include,
        subQuery: false,
      }),
    ]);

    // Enriquecer filas con hora_revision_puerto desde Contenedor via Listado
    const uniquePairs = [
      ...new Map(
        result
          .filter((r) => r.contenedor && r.semana)
          .map((r) => [`${r.contenedor}|${r.semana}`, { contenedor: r.contenedor, semana: r.semana }])
      ).values(),
    ];

    const revisionMap = new Map();
    if (uniquePairs.length) {
      const codes = [...new Set(uniquePairs.map((p) => p.contenedor))];
      const semanas = [...new Set(uniquePairs.map((p) => p.semana))];
      const listadoRows = await db.Listado.findAll({
        attributes: ['id_contenedor'],
        include: [
          {
            model: db.Contenedor,
            where: { contenedor: { [Op.in]: codes } },
            attributes: ['id', 'contenedor', 'hora_revision_puerto'],
            required: true,
          },
          {
            model: db.Embarque,
            attributes: [],
            required: true,
            include: [{
              model: db.semanas,
              where: { consecutivo: { [Op.in]: semanas } },
              attributes: ['consecutivo'],
              required: true,
            }],
          },
        ],
      });
      for (const lr of listadoRows) {
        const code = lr.Contenedor?.contenedor;
        const sem = lr.Embarque?.semana?.consecutivo;
        if (code && sem) {
          revisionMap.set(`${code}|${sem}`, lr.Contenedor.hora_revision_puerto || null);
        }
      }
    }

    const data = result.map((row) => {
      const key = `${row.contenedor}|${row.semana}`;
      return Object.assign(row, { hora_revision_puerto: revisionMap.get(key) ?? null });
    });

    return { data, total: count, distinctContenedores };
  }

  // Historial de una programacion puntual (creacion, ediciones, eliminacion).
  async historialPorId(programacion_id) {
    const rows = await db.programacion_historial.findAll({
      where: { programacion_id },
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
    });
    return rows.map((row) => this.formatHistorialRow(row));
  }

  // Historial general filtrable: util para consultar que habia antes de una
  // eliminacion, ya que esa fila deja de existir en programacion (hard delete).
  async paginarHistorial(offset, limit, body = {}) {
    const where = {};
    if (body?.programacion_id) where.programacion_id = body.programacion_id;
    if (body?.accion) where.accion = body.accion;
    if (body?.usuario) where.usuario = { [Op.like]: `%${body.usuario}%` };
    if (body?.contenedor) where.contenedor = { [Op.like]: `%${body.contenedor}%` };
    if (body?.bl) where.bl = { [Op.like]: `%${body.bl}%` };
    if (body?.semana) where.semana = body.semana;

    // Filtra por el campo "fecha" que digita el usuario en el registro (la fecha
    // del viaje/movimiento, la que se ve en la tabla). No hay columna propia para
    // esto en el historial: se lee del snapshot JSON guardado (datos_nuevos, y si
    // no existe -p.ej. en un "eliminado"- se usa datos_anteriores).
    const fechaCampo = db.sequelize.fn(
      'COALESCE',
      db.sequelize.fn('JSON_UNQUOTE', db.sequelize.fn('JSON_EXTRACT', db.sequelize.col('datos_nuevos'), '$.fecha')),
      db.sequelize.fn('JSON_UNQUOTE', db.sequelize.fn('JSON_EXTRACT', db.sequelize.col('datos_anteriores'), '$.fecha'))
    );
    const fechaConditions = [];
    if (body?.fechaInicio) fechaConditions.push(db.sequelize.where(fechaCampo, { [Op.gte]: body.fechaInicio }));
    if (body?.fechaFin) fechaConditions.push(db.sequelize.where(fechaCampo, { [Op.lte]: body.fechaFin }));

    const parsedLimit = parseInt(limit, 10) || 25;
    const page = parseInt(offset, 10) || 1;
    const parsedOffset = (page - 1) * parsedLimit;

    const { count, rows } = await db.programacion_historial.findAndCountAll({
      where: fechaConditions.length ? { [Op.and]: [where, ...fechaConditions] } : where,
      limit: parsedLimit,
      offset: parsedOffset,
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
    });

    return { data: rows.map((row) => this.formatHistorialRow(row)), total: count };
  }

  formatHistorialRow(row) {
    const item = row.toJSON();
    return {
      ...item,
      // Se conserva fecha_hora por compatibilidad; creado_en/actualizado_en son
      // los mismos datos con nombres explicitos, en hora Bogota.
      fecha_hora: toColombiaIso(item.createdAt),
      creado_en: toColombiaIso(item.createdAt),
      actualizado_en: toColombiaIso(item.updatedAt),
    };
  }

}

module.exports = ProgramacionService;





