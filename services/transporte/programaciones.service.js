const boom = require('@hapi/boom');
const { Op, Sequelize } = require('sequelize');
const db = require('../../models');


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

  async create(data) {
    await this.validateBl(data?.bl);
    await this.validateTipoMovimiento(data);
    const vehiculoSinCombustible = await this.isVehiculoSinCombustible(data?.vehiculo_id);
    if (!vehiculoSinCombustible) {
      await this.validateFechaPosteriorALiquidacion(data?.vehiculo_id, data?.fecha);
      await this.validateSaldoConsistenteConUltimaLiquidacion(data?.vehiculo_id);
    }
    const body = { ...data, eliminado: false }
    return await db.programacion.create(body);
  }


  async find() {
    return await db.programacion.findAll({
      include: [
        { model: db.productos_viajes },
        { model: db.conductores, as: 'conductor' },
        { model: db.rutas, include: [{ model: db.ubicaciones, as: 'ubicacion_1' }, { model: db.ubicaciones, as: 'ubicacion_2' }] },
        { model: db.clientes },
      ]
    });
  }

  async findOne(id) {
    const item = await db.programacion.findOne({ where: { id } });
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
    if (Object.prototype.hasOwnProperty.call(changes, 'bl')) {
      await this.validateBl(changes.bl);
    }
    await this.validateTipoMovimiento(changes, item);
    const vehiculoId = changes?.vehiculo_id || item?.vehiculo_id;
    const fecha = Object.prototype.hasOwnProperty.call(changes, 'fecha') ? changes.fecha : item?.fecha;
    const vehiculoSinCombustible = await this.isVehiculoSinCombustible(vehiculoId);
    if (!vehiculoSinCombustible) {
      await this.validateFechaPosteriorALiquidacion(vehiculoId, fecha);
      await this.validateSaldoConsistenteConUltimaLiquidacion(vehiculoId);
    }
    await db.programacion.update(changes, { where: { id } });
    return { message: "El item fue actualizado", id };
  }

  async delete(id) {
    const existe = await db.programacion.findOne({ where: { id } });
    if (!existe) {
      throw boom.notFound('El item no existe');
    }
    await db.programacion.destroy({ where: { id } });
    return { message: "El item fue eliminado", id };
  }

  async paginate(offset, limit, body) {

    let fecha = { [Op.like]: `%${body?.fecha || ''}%` };
    if (body?.fechaFin) {
      const inicio = new Date(body?.fecha);
      const fin = new Date(body?.fechaFin);
      fecha = { [Op.between]: [inicio, fin] }
    }
    delete body.fechaFin;
    const whereClause = {
      where: {
        semana: { [Op.like]: `%${body?.semana || ''}%` },
        movimiento: { [Op.like]: `%${body?.movimiento || ''}%` },
        fecha: fecha
      },
      order: [['fecha', 'DESC'], ['vehiculo_id', 'DESC'], ['id', 'DESC']],
      include: [
        {
          model: db.rutas,
          include: [
            { model: db.ubicaciones, as: 'ubicacion_1' },
            { model: db.ubicaciones, as: 'ubicacion_2' },
            { model: db.galones_por_ruta },
          ],
          where: {
            ubicacion1: { [Op.like]: `%${body.ubicacion1 || ''}%` },
            ubicacion2: { [Op.like]: `%${body.ubicacion2 || ''}%` },
          },
        },
        { model: db.productos_viajes },
        {
          model: db.conductores,
          as: 'conductor',
          where: {
            conductor: { [Op.like]: `%${body.conductor || ''}%` },
          },
        },
        { model: db.clientes },
        {
          model: db.vehiculo,
          where: {
            placa: { [Op.like]: `%${body.vehiculo || ''}%` },
          },
        },
      ],
    };

    if (offset || limit) {
      const newLimit = parseInt(limit);
      const newOffset = (parseInt(offset) - 1) * newLimit;
      whereClause.limit = newLimit;
      whereClause.offset = newOffset;
    }

    if (body.eliminado) {
      whereClause.where.eliminado = body.eliminado;
    }

    if (body?.bl) {
      whereClause.where.bl = { [Op.like]: `%${body.bl}%` };
    }

    const result = await db.programacion.findAll(whereClause);
    const count = await db.programacion.count(whereClause);
 

    return { data: result, total: count };
  }

}

module.exports = ProgramacionService;

