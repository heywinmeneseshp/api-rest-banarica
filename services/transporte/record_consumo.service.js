const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class record_consumosService {
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

  async validateVehicleLiquidationDate(vehiclePreview, fechaInicio, fechaFin) {
    const vehiculosSinCombustible = await this.getVehiculosSinCombustibleSet();
    if (vehiculosSinCombustible.has(String(vehiclePreview?.vehiculo?.id || ''))) {
      return;
    }

    const lastLiquidatedRecord = await this.getLastLiquidatedRecordByVehicle(vehiclePreview?.vehiculo?.id);
    const lastLiquidatedDate = this.normalizeDate(lastLiquidatedRecord?.fecha);
    if (!lastLiquidatedDate) {
      return;
    }

    const movementDates = (vehiclePreview?.movimientos || [])
      .map((item) => this.normalizeDate(item?.fecha))
      .filter(Boolean)
      .sort();

    const firstMovementDate = movementDates[0] || this.normalizeDate(fechaInicio) || this.normalizeDate(fechaFin);
    if (firstMovementDate && firstMovementDate < lastLiquidatedDate) {
      throw boom.conflict(`No se puede liquidar el vehiculo ${vehiclePreview?.vehiculo?.placa || vehiclePreview?.vehiculo?.id || ''} porque tiene movimientos anteriores a su ultima fecha liquidada (${lastLiquidatedDate})`);
    }
  }

  async validateVehicleBalanceConsistency(vehiclePreview) {
    const vehiculosSinCombustible = await this.getVehiculosSinCombustibleSet();
    const vehiculoId = String(vehiclePreview?.vehiculo?.id || '');
    if (vehiculosSinCombustible.has(vehiculoId)) {
      return;
    }
    if (!vehiculoId) {
      return;
    }

    const lastLiquidatedRecord = await this.getLastLiquidatedRecordByVehicle(vehiculoId);
    if (!lastLiquidatedRecord) {
      return;
    }

    const saldoLiquidado = this.getLiquidatedBalance(lastLiquidatedRecord);
    if (saldoLiquidado == null || Number.isNaN(saldoLiquidado)) {
      return;
    }

    const lastTanqueo = await db.tanqueos.findOne({
      where: { vehiculo_id: vehiculoId },
      order: [['fecha', 'DESC'], ['id', 'DESC']],
    });

    const lastLiquidatedDate = this.normalizeDate(lastLiquidatedRecord.fecha);
    const lastTanqueoDate = this.normalizeDate(lastTanqueo?.fecha);
    const saldoBase = lastTanqueoDate && lastLiquidatedDate && lastTanqueoDate >= lastLiquidatedDate
      ? Number(lastTanqueo?.saldo_nuevo ?? saldoLiquidado)
      : saldoLiquidado;

    if (saldoBase == null || Number.isNaN(saldoBase)) {
      return;
    }

    const saldoActual = Number(vehiclePreview?.saldoActual ?? vehiclePreview?.vehiculo?.combustible ?? 0);
    if (Math.abs(saldoActual - saldoBase) > 0.0001) {
      throw boom.conflict(`El vehiculo ${vehiclePreview?.vehiculo?.placa || vehiculoId} tiene un descuadre de saldo. Saldo actual: ${saldoActual.toFixed(2)}. Ultimo saldo conciliado: ${saldoBase.toFixed(2)} con fecha ${lastTanqueoDate && lastTanqueoDate >= lastLiquidatedDate ? lastTanqueoDate : lastLiquidatedDate}`);
    }
  }

  async create(data) {
    const existe = await db.record_consumos.findOne({ where: data });
    if (existe !== null) {
      throw boom.conflict('El item ya existe');
    }
    return await db.record_consumos.create(data);
  }

  async find() {
    return await db.record_consumos.findAll();
  }

  async sinLiquidar() {
    try {
      const vehiculosSinCombustible = await this.getVehiculosSinCombustibleSet();
      const fechasUnicas = await db.programacion.findAll({
        where: { activo: true },
        attributes: ['fecha', 'vehiculo_id', 'semana', 'conductor_id'],
        group: ['fecha', 'vehiculo_id']
      });

      const resultados = await Promise.all(fechasUnicas
        .filter((item) => !vehiculosSinCombustible.has(String(item?.vehiculo_id || '')))
        .map(async (item) => {
        const [record_consumo] = await db.record_consumos.findOrCreate({
          where: { vehiculo_id: item.vehiculo_id, fecha: item.fecha },
          defaults: {
            liquidado: false,
            activo: true,
            semana: item.semana,
            conductor_id: item.conductor_id,
            tanqueo: 0,
          },
          include: [{ model: db.vehiculo }]
        });
        return record_consumo;
      }));

      return resultados;
    } catch (error) {
      console.error('Error in sinLiquidar:', error);
      throw error;
    }
  }

  async consultarConsumo(body) {
    try {
      const rutas_programadas = await db.programacion.findAll({
        where: body,
        include: [{ model: db.vehiculo }]
      });
      let suma = 0;
      rutas_programadas.map(item => {
        const categoria_vehiculo = item.dataValues.vehiculo.dataValues.categoria_id;
        const array = item.dataValues.ruta.dataValues.galones_por_ruta.find(element => {
          return element.dataValues.categoria_id == categoria_vehiculo;
        });
        suma = suma + array.dataValues.galones_por_ruta;
      });

      return { rutas_programadas, consumo: suma };
    } catch (error) {
      console.error('Error al consultar el consumo:', error);
      throw new Error('Error al consultar el consumo');
    }
  }

  buildLiquidationTag(fechaInicio, fechaFin) {
    if (!fechaInicio && !fechaFin) return 'LIQUIDACION_RUTA:PENDIENTES';
    return `LIQUIDACION_RUTA:${fechaInicio || 'SIN_FECHA'}:${fechaFin || fechaInicio || 'SIN_FECHA'}`;
  }

  buildDateWhere(fechaInicio, fechaFin) {
    if (!fechaInicio && !fechaFin) return undefined;
    if (fechaInicio && fechaFin) {
      return { [Op.between]: [fechaInicio, fechaFin] };
    }
    return fechaInicio || fechaFin;
  }

  buildTanqueoDateWhere(fechaInicio, fechaFin) {
    if (!fechaInicio && !fechaFin) return undefined;

    const inicio = new Date(fechaInicio || fechaFin);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFin || fechaInicio);
    fin.setHours(23, 59, 59, 999);

    return { [Op.between]: [inicio, fin] };
  }

  buildPendingTanqueoWhere(vehicleIds, fechaInicio, fechaFin) {
    const where = {
      vehiculo_id: Array.isArray(vehicleIds) ? { [Op.in]: vehicleIds } : String(vehicleIds),
      [Op.or]: [
        { record_consumo_id: null },
        { record_consumo_id: '' },
      ],
    };

    const tanqueoDateWhere = this.buildTanqueoDateWhere(fechaInicio, fechaFin);
    if (tanqueoDateWhere) {
      where.fecha = tanqueoDateWhere;
    }

    return where;
  }

  async buildRutaLiquidationPreview(body) {
    const fechaInicio = body?.fecha || '';
    const fechaFin = body?.fechaFin || body?.fecha || '';
    const vehiculoId = body?.vehiculo_id ? String(body.vehiculo_id) : '';
    const vehiculoLike = body?.vehiculo || '';

    const whereProgramaciones = { activo: true };
    const dateWhere = this.buildDateWhere(fechaInicio, fechaFin);
    if (dateWhere) {
      whereProgramaciones.fecha = dateWhere;
    }
    if (vehiculoId) {
      whereProgramaciones.vehiculo_id = vehiculoId;
    }

    const programaciones = await db.programacion.findAll({
      where: whereProgramaciones,
      include: [
        { model: db.rutas, include: [{ model: db.ubicaciones, as: 'ubicacion_1' }, { model: db.ubicaciones, as: 'ubicacion_2' }] },
        { model: db.conductores, as: 'conductor' },
        {
          model: db.vehiculo,
          where: vehiculoLike ? { placa: { [Op.like]: `%${vehiculoLike}%` } } : undefined,
        },
      ],
      order: [['vehiculo_id', 'ASC'], ['fecha', 'ASC'], ['id', 'ASC']],
    });

    const tanqueoWhere = {
      [Op.or]: [
        { record_consumo_id: null },
        { record_consumo_id: '' },
      ],
    };
    const tanqueoDateWhere = this.buildTanqueoDateWhere(fechaInicio, fechaFin);
    if (tanqueoDateWhere) {
      tanqueoWhere.fecha = tanqueoDateWhere;
    }
    if (vehiculoId) {
      tanqueoWhere.vehiculo_id = vehiculoId;
    }

    const tanqueos = await db.tanqueos.findAll({
      where: tanqueoWhere,
      include: [{
        model: db.vehiculo,
        required: Boolean(vehiculoLike),
        where: vehiculoLike ? { placa: { [Op.like]: `%${vehiculoLike}%` } } : undefined,
      }],
      order: [['vehiculo_id', 'ASC'], ['fecha', 'ASC'], ['id', 'ASC']],
    });

    const vehiculosSinCombustible = await this.getVehiculosSinCombustibleSet();
    const vehicleIds = [...new Set([
      ...programaciones.map((item) => String(item.vehiculo_id)),
      ...tanqueos.map((item) => String(item.vehiculo_id || item?.vehiculo?.id || '')),
    ].filter((vehiculoId) => Boolean(vehiculoId) && !vehiculosSinCombustible.has(String(vehiculoId))))];

    if (!vehicleIds.length) {
      return {
        fechaInicio,
        fechaFin,
        vehicles: [],
        totalConsumido: 0,
        totalCargado: 0,
        totalSaldoActual: 0,
        totalSaldoProyectado: 0,
      };
    }

    const consumosRuta = await db.consumo_ruta_vehiculo.findAll({
      where: { vehiculo_id: { [Op.in]: vehicleIds } },
    });

    const liquidationTag = this.buildLiquidationTag(fechaInicio, fechaFin);
    const records = await db.record_consumos.findAll({
      where: {
        vehiculo_id: { [Op.in]: vehicleIds },
        detalle: liquidationTag,
      },
    });

    const recordsByVehicle = new Map(records.map((item) => [String(item.vehiculo_id), item]));
    const consumosByVehicleRoute = new Map(consumosRuta.map((item) => [`${item.vehiculo_id}__${item.ruta_id}`, item]));
    const tanqueosByVehicle = tanqueos.reduce((acc, item) => {
      const key = String(item.vehiculo_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    const programacionesByVehicle = programaciones.reduce((acc, item) => {
      const key = String(item.vehiculo_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const vehicles = vehicleIds.map((id) => {
      const programacionItems = programacionesByVehicle[id] || [];
      const vehiculo = programacionItems[0]?.vehiculo || tanqueosByVehicle[id]?.[0]?.vehiculo;
      const record = recordsByVehicle.get(id);
      const movimientos = programacionItems.map((item) => {
        const configuracion = consumosByVehicleRoute.get(`${id}__${item.ruta_id}`);
        const origen = item?.ruta?.ubicacion_1?.ubicacion || item?.ruta?.ubicacion1 || 'Origen';
        const destino = item?.ruta?.ubicacion_2?.ubicacion || item?.ruta?.ubicacion2 || 'Destino';
        return {
          id: item.id,
          fecha: item.fecha,
          semana: item.semana,
          movimiento: item.movimiento,
          conductor: item?.conductor?.conductor || '',
          ruta: `${origen} - ${destino}`,
          ruta_id: item.ruta_id,
          galones_consumidos: Number(configuracion?.consumo_por_km || 0),
          configurado: Boolean(configuracion),
        };
      });

      const cargas = (tanqueosByVehicle[id] || []).map((item) => ({
        id: item.id,
        fecha: item.fecha,
        factura: item.factura,
        tanqueo: Number(item.tanqueo || 0),
        costo: Number(item.costo || 0),
        observacion: item.observacion || '',
      }));

      const totalConsumido = movimientos.reduce((sum, item) => sum + Number(item.galones_consumidos || 0), 0);
      const totalCargado = cargas.reduce((sum, item) => sum + Number(item.tanqueo || 0), 0);
      const alreadyLiquidated = Boolean(record?.liquidado && record?.detalle === liquidationTag);
      const saldoActual = Number(vehiculo?.combustible || 0);
      const saldoProyectado = saldoActual - totalConsumido;

      return {
        vehiculo: {
          id: vehiculo?.id,
          placa: vehiculo?.placa,
          vehiculo: vehiculo?.vehiculo,
          modelo: vehiculo?.modelo,
        },
        movimientos,
        tanqueos: cargas,
        totalConsumido,
        totalCargado,
        saldoActual,
        saldoProyectado,
        alreadyLiquidated,
        hasPendingTanqueos: cargas.length > 0,
        record_consumo_id: record?.id || null,
      };
    });

    return {
      fechaInicio,
      fechaFin,
      vehicles,
      totalConsumido: vehicles.reduce((sum, item) => sum + item.totalConsumido, 0),
      totalCargado: vehicles.reduce((sum, item) => sum + item.totalCargado, 0),
      totalSaldoActual: vehicles.reduce((sum, item) => sum + item.saldoActual, 0),
      totalSaldoProyectado: vehicles.reduce((sum, item) => sum + item.saldoProyectado, 0),
    };
  }

  async previewLiquidacionRuta(body) {
    const preview = await this.buildRutaLiquidationPreview(body);
    for (const vehiclePreview of preview.vehicles) {
      await this.validateVehicleLiquidationDate(vehiclePreview, body?.fecha || '', body?.fechaFin || body?.fecha || '');
      await this.validateVehicleBalanceConsistency(vehiclePreview);
    }
    return preview;
  }

  async liquidarRuta(body) {
    const preview = await this.buildRutaLiquidationPreview(body);
    const liquidarTodos = Boolean(body?.liquidarTodos);
    const fechaInicio = body?.fecha || '';
    const fechaFin = body?.fechaFin || body?.fecha || '';
    const liquidationTag = this.buildLiquidationTag(fechaInicio, fechaFin);

    if (!preview.vehicles.length) {
      throw boom.badRequest('No hay movimientos pendientes para liquidar con esos filtros');
    }

    const targetVehicles = liquidarTodos
      ? preview.vehicles
      : preview.vehicles.filter((item) => String(item.vehiculo?.id) === String(body?.vehiculo_id || ''));

    if (!targetVehicles.length) {
      throw boom.badRequest('No se encontro el vehiculo a liquidar en el filtro seleccionado');
    }

    const transaction = await db.sequelize.transaction();
    try {
      for (const vehiclePreview of targetVehicles) {
        await this.validateVehicleLiquidationDate(vehiclePreview, fechaInicio, fechaFin);
        await this.validateVehicleBalanceConsistency(vehiclePreview);
        const firstMovement = vehiclePreview.movimientos[0];
        const pendingTanqueos = await db.tanqueos.findAll({
          where: this.buildPendingTanqueoWhere(vehiclePreview.vehiculo.id, fechaInicio, fechaFin),
          transaction,
        });
        const firstTanqueo = pendingTanqueos[0] || vehiclePreview.tanqueos?.[0] || null;
        const recordSemana = firstMovement?.semana || body?.semana || '';
        const recordFecha = fechaFin || fechaInicio || firstMovement?.fecha || firstTanqueo?.fecha || null;
        const totalPendingTanqueo = pendingTanqueos.reduce((sum, item) => sum + Number(item.tanqueo || 0), 0);
        const stockInicialCalculado = Number(vehiclePreview.saldoActual || 0) - totalPendingTanqueo;

        const existingRecord = vehiclePreview.record_consumo_id
          ? await db.record_consumos.findOne({
            where: { id: vehiclePreview.record_consumo_id },
            transaction,
          })
          : null;

        let recordId = existingRecord?.id || null;

        if (existingRecord) {
          await db.record_consumos.update({
            semana: existingRecord.semana || recordSemana,
            fecha: recordFecha,
            tanqueo: Number(existingRecord.tanqueo || 0) + totalPendingTanqueo,
            stock_inicial: existingRecord.stock_inicial ?? stockInicialCalculado,
            stock_final: vehiclePreview.saldoProyectado,
            stock_real: vehiclePreview.saldoProyectado,
            liquidado: true,
            activo: true,
          }, {
            where: { id: existingRecord.id },
            transaction,
          });
        } else {
          const newRecord = await db.record_consumos.create({
            semana: recordSemana,
            conductor_id: '',
            vehiculo_id: vehiclePreview.vehiculo.id,
            fecha: recordFecha,
            activo: true,
            liquidado: true,
            tanqueo: totalPendingTanqueo,
            detalle: liquidationTag,
            stock_inicial: stockInicialCalculado,
            stock_final: vehiclePreview.saldoProyectado,
            stock_real: vehiclePreview.saldoProyectado,
            gal_por_km: 0,
            km_recorridos: 0,
          }, { transaction });

          recordId = newRecord.id;
        }

        if (recordId && pendingTanqueos.length) {
          await db.tanqueos.update({
            record_consumo_id: recordId,
          }, {
            where: {
              id: { [Op.in]: pendingTanqueos.map((item) => item.id) },
            },
            transaction,
          });
        }

        await db.vehiculo.update({ combustible: vehiclePreview.saldoProyectado }, {
          where: { id: vehiclePreview.vehiculo.id },
          transaction,
        });

        const whereProgramaciones = {
          vehiculo_id: vehiclePreview.vehiculo.id,
          activo: true,
        };
        const dateWhere = this.buildDateWhere(fechaInicio, fechaFin);
        if (dateWhere) {
          whereProgramaciones.fecha = dateWhere;
        }

        await db.programacion.update({ activo: false }, {
          where: whereProgramaciones,
          transaction,
        });
      }

      await transaction.commit();
      return this.buildRutaLiquidationPreview(body);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async liquidar(body) {
    const stock_real = body.stock_real * 1;
    const tanqueo = body.tanqueo * 1;
    const record_consumo_id = body.record_consumo_id;

    const item = await db.record_consumos.findOne({
      where: { id: record_consumo_id },
      include: [{ model: db.vehiculo }]
    });

    const programaciones = await db.programacion.findAll({
      where: { fecha: item.dataValues.fecha, activo: true, vehiculo_id: item.dataValues.vehiculo_id },
      include: [{ model: db.vehiculo }]
    });

    let consumo = item.dataValues.km_recorridos * item.dataValues.vehiculo.dataValues.gal_por_km;

    programaciones.map(async item => {
      await db.programacion.update({ activo: false }, { where: { id: item.dataValues.id } });
    });

    await db.vehiculo.update({ combustible: stock_real }, { where: { id: item.dataValues.vehiculo.dataValues.id } });
    const stock_final = programaciones[0].dataValues.vehiculo.dataValues.combustible + tanqueo - consumo;

    const res = await db.record_consumos.update({
      activo: true,
      liquidado: true,
      stock_inicial: programaciones[0].dataValues.vehiculo.dataValues.combustible,
      stock_real: stock_real,
      gal_por_km: item.dataValues.vehiculo.dataValues.gal_por_km,
      tanqueo: tanqueo,
      stock_final: stock_final
    }, {
      where: { id: record_consumo_id }
    });

    return res;
  }

  async findOne(data) {
    const item = await db.record_consumos.findOne({ where: data });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async update(id, changes) {
    const item = await db.record_consumos.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe');
    await db.record_consumos.update(changes, { where: { id } });
    const result = await db.record_consumos.findOne({ where: { id } });
    const fechaOriginal = new Date(result.dataValues.fecha);
    const fecha = new Date(fechaOriginal);
    const fechaNueva = new Date(fecha);
    fechaNueva.setDate(fechaNueva.getDate() + 1);
    const fechaFormateada = fechaNueva.toISOString().slice(0, 10);

    const nextResult = await db.record_consumos.findOne({ where: { fecha: fechaFormateada, vehiculo_id: result.dataValues.vehiculo_id } });
    const res = { ...result.dataValues, nextItem: nextResult };
    return res;
  }

  async delete(id) {
    const existe = await db.record_consumos.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.record_consumos.destroy({ where: { id } });
    return { message: 'El item fue eliminado', id };
  }

  async paginate(offset, limit, item) {
    let body = {};
    if (item.fecha) body.fecha = item.fecha;
    if (item.fechaFin) {
      let fecha_inicial = new Date(item.fecha);
      fecha_inicial.setDate(fecha_inicial.getDate());
      fecha_inicial = `${fecha_inicial.getFullYear()}-${String(fecha_inicial.getMonth() + 1).padStart(2, '0')}-${String(fecha_inicial.getDate()).padStart(2, '0')}`;
      const inicio = new Date(fecha_inicial);
      const fin = new Date(item.fechaFin);
      body.fecha = { [Op.between]: [inicio, fin] };
    }
    delete body.fechaFin;
    if (item.semana) body.semana = item.semana;
    if (item.liquidado == null) {
      body.liquidado = [true, false];
    } else {
      body.liquidado = item?.liquidado;
    }
    const vehiculo = item?.vehiculo || '';
    const conductor = item?.conductor || '';

    let whereClause = {
      where: body,
      include: [
        {
          model: db.vehiculo,
          where: { placa: { [Op.like]: `%${vehiculo}%` } }
        },
        {
          model: db.conductores,
          where: { conductor: { [Op.like]: `%${conductor}%` } }
        }
      ],
      order: [['fecha', 'DESC']],
    };

    if (limit) {
      let newLimit = parseInt(limit);
      let newOffset = (parseInt(offset) - 1) * newLimit;
      whereClause = {
        ...whereClause,
        limit: newLimit,
        offset: newOffset
      };
    }

    const rows = await db.record_consumos.findAll(whereClause);
    const count = await db.record_consumos.count(whereClause);

    return { data: rows, total: count };
  }
}

module.exports = record_consumosService
