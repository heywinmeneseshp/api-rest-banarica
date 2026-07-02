const boom = require('@hapi/boom');
const { Op, Sequelize } = require('sequelize');
const db = require('../../models');
const { normalizeRole, ROLES } = require('../../middlewares/auth.handler');

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

  async create(data) {
    await this.validateBl(data?.bl);
    await this.validateTipoMovimiento(data);
    const vehiculoSinCombustible = await this.isVehiculoSinCombustible(data?.vehiculo_id);
    if (!vehiculoSinCombustible) {
      await this.validateFechaPosteriorALiquidacion(data?.vehiculo_id, data?.fecha);
      await this.validateSaldoConsistenteConUltimaLiquidacion(data?.vehiculo_id);
    }
    const body = { ...data, eliminado: false, estado_listado: data?.estado_listado || ESTADO_LISTADO_PENDIENTE }
    return await db.programacion.create(body);
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

  async update(id, changes) {
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
    if (movimientoOContenedorCambian) {
      await this.validateTipoMovimiento(changes, item);
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

    const nextChanges = { ...changes };
    if (!Object.prototype.hasOwnProperty.call(nextChanges, 'estado_listado')) {
      nextChanges.estado_listado = ESTADO_LISTADO_PENDIENTE;
    }
    await db.programacion.update(nextChanges, { where: { id } });
    return { message: "El item fue actualizado", id };
  }

  async bulkUpdate(rows = []) {
    const errors = [];
    let processed = 0;
    for (const row of rows) {
      try {
        const { id, ...changes } = row;
        if (!id) throw new Error('Falta el campo id');
        await this.update(id, changes);
        processed += 1;
      } catch (e) {
        errors.push({ id: row?.id, error: e?.message || 'Error desconocido' });
      }
    }
    return { processed, total: rows.length, errors };
  }

  async delete(id) {
    const existe = await db.programacion.findOne({ where: { id } });
    if (!existe) {
      throw boom.notFound('El item no existe');
    }
    await db.programacion.destroy({ where: { id } });
    return { message: "El item fue eliminado", id };
  }

  async paginate(offset, limit, body, user = null) {
    // Desectructurar para no mutar el objeto recibido
    const { fechaFin, ...restBody } = body || {};

    let fecha;
    if (fechaFin) {
      fecha = { [Op.between]: [new Date(restBody?.fecha), new Date(fechaFin)] };
    } else if (restBody?.fecha) {
      fecha = { [Op.like]: `%${restBody.fecha}%` };
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
    const [result, count] = await Promise.all([
      db.programacion.findAll(pageClause),
      db.programacion.count(baseClause),
    ]);

    return { data: result, total: count };
  }

}

module.exports = ProgramacionService;





