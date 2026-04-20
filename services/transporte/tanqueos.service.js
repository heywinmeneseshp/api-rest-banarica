const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class tanqueosService {
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
      throw boom.conflict(`No se puede cargar combustible al vehiculo en ${normalizedFecha} porque su ultima fecha liquidada es ${lastLiquidatedDate}`);
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

  buildInclude() {
    return [
      {
        model: db.vehiculo,
        required: false,
      },
    ];
  }

  async create(data) {
    await this.validateFechaPosteriorALiquidacion(data?.vehiculo_id, data?.fecha);
    await this.validateSaldoConsistenteConUltimaLiquidacion(data?.vehiculo_id);
    const newItem = await db.tanqueos.create(data);
    return db.tanqueos.findOne({
      where: { id: newItem.id },
      include: this.buildInclude(),
    });
  }

  async cargarCombustible(data) {
    const vehiculoId = data?.vehiculo_id;
    const galones = Number(data?.tanqueo || 0);

    if (!vehiculoId) throw boom.badRequest('El vehiculo es obligatorio');
    if (Number.isNaN(galones) || galones <= 0) throw boom.badRequest('La cantidad de galones debe ser mayor a cero');

    const transaction = await db.sequelize.transaction();

    try {
      const vehiculo = await db.vehiculo.findOne({ where: { id: vehiculoId }, transaction });
      if (!vehiculo) throw boom.notFound('El vehiculo no existe');
      await this.validateFechaPosteriorALiquidacion(vehiculoId, data?.fecha);
      await this.validateSaldoConsistenteConUltimaLiquidacion(vehiculoId);

      const saldoAnterior = Number(vehiculo.combustible || 0);
      const saldoNuevo = saldoAnterior + galones;

      await db.vehiculo.update(
        { combustible: saldoNuevo },
        { where: { id: vehiculoId }, transaction }
      );

      const tanqueo = await db.tanqueos.create({
        fecha: data.fecha || new Date(),
        factura: data.factura || null,
        tanqueo: galones,
        costo: data.costo ? Number(data.costo) : null,
        record_consumo_id: data.record_consumo_id || null,
        vehiculo_id: String(vehiculoId),
        saldo_anterior: saldoAnterior,
        saldo_nuevo: saldoNuevo,
        observacion: data.observacion || null,
        activo: data.activo == null ? true : Boolean(data.activo),
      }, { transaction });

      await transaction.commit();

      return db.tanqueos.findOne({
        where: { id: tanqueo.id },
        include: this.buildInclude(),
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async ajustarSaldo(data) {
    const vehiculoId = data?.vehiculo_id;
    const nuevoSaldo = Number(data?.nuevo_saldo);

    if (!vehiculoId) throw boom.badRequest('El vehiculo es obligatorio');
    if (Number.isNaN(nuevoSaldo) || nuevoSaldo < 0) throw boom.badRequest('El nuevo saldo debe ser mayor o igual a cero');

    await this.validateFechaPosteriorALiquidacion(vehiculoId, data?.fecha);

    const transaction = await db.sequelize.transaction();

    try {
      const vehiculo = await db.vehiculo.findOne({ where: { id: vehiculoId }, transaction });
      if (!vehiculo) throw boom.notFound('El vehiculo no existe');

      const saldoAnterior = Number(vehiculo.combustible || 0);
      const delta = nuevoSaldo - saldoAnterior;

      await db.vehiculo.update(
        { combustible: nuevoSaldo },
        { where: { id: vehiculoId }, transaction }
      );

      const tanqueo = await db.tanqueos.create({
        fecha: data.fecha || new Date(),
        factura: data.factura || 'AJUSTE',
        tanqueo: delta,
        costo: null,
        record_consumo_id: null,
        vehiculo_id: String(vehiculoId),
        saldo_anterior: saldoAnterior,
        saldo_nuevo: nuevoSaldo,
        observacion: `AJUSTE DE SALDO${data?.observacion ? `: ${data.observacion}` : ''}`,
        activo: data.activo == null ? true : Boolean(data.activo),
      }, { transaction });

      await transaction.commit();

      return db.tanqueos.findOne({
        where: { id: tanqueo.id },
        include: this.buildInclude(),
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async find() {
    return db.tanqueos.findAll({
      include: this.buildInclude(),
      order: [['fecha', 'DESC'], ['id', 'DESC']],
    });
  }

  async findOne(data) {
    const where = typeof data === 'object' ? data : { id: data };
    const item = await db.tanqueos.findOne({ where, include: this.buildInclude() });
    if (!item) throw boom.notFound('El item no existe');
    return item;
  }

  async findAll(data) {
    const body = data || {};
    const where = {};
    const vehiculoWhere = {};

    if (body.vehiculo_id) where.vehiculo_id = body.vehiculo_id;
    if (body.activo != null && body.activo !== '') where.activo = body.activo;
    if (body.factura) where.factura = { [Op.like]: `%${body.factura}%` };
    if (body.fecha && body.fechaFin) {
      where.fecha = { [Op.between]: [new Date(body.fecha), new Date(body.fechaFin)] };
    } else if (body.fecha) {
      where.fecha = body.fecha;
    }
    if (body.vehiculo) {
      vehiculoWhere.placa = { [Op.like]: `%${body.vehiculo}%` };
    }

    return db.tanqueos.findAll({
      where,
      include: [
        {
          model: db.vehiculo,
          required: Object.keys(vehiculoWhere).length > 0,
          where: Object.keys(vehiculoWhere).length > 0 ? vehiculoWhere : undefined,
        },
      ],
      order: [['fecha', 'DESC'], ['id', 'DESC']],
    });
  }

  async update(id, changes) {
    const item = await db.tanqueos.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe');
    const vehiculoId = changes?.vehiculo_id || item?.vehiculo_id;
    const fecha = Object.prototype.hasOwnProperty.call(changes, 'fecha') ? changes.fecha : item?.fecha;
    await this.validateFechaPosteriorALiquidacion(vehiculoId, fecha);
    await this.validateSaldoConsistenteConUltimaLiquidacion(vehiculoId);
    await db.tanqueos.update(changes, { where: { id } });
    return db.tanqueos.findOne({ where: { id }, include: this.buildInclude() });
  }

  async delete(id) {
    const existe = await db.tanqueos.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.tanqueos.destroy({ where: { id } });
    return { message: 'El item fue eliminado', id };
  }

  async paginate(offset, limit, item) {
    const page = parseInt(offset || 1);
    const pageLimit = parseInt(limit || 20);
    const newOffset = (page - 1) * pageLimit;
    const body = item || {};
    const where = {};
    const vehiculoWhere = {};

    if (body.vehiculo_id) where.vehiculo_id = body.vehiculo_id;
    if (body.activo != null && body.activo !== '') where.activo = body.activo;
    if (body.factura) where.factura = { [Op.like]: `%${body.factura}%` };
    if (body.fecha && body.fechaFin) {
      where.fecha = { [Op.between]: [new Date(body.fecha), new Date(body.fechaFin)] };
    } else if (body.fecha) {
      where.fecha = body.fecha;
    }
    if (body.vehiculo) {
      vehiculoWhere.placa = { [Op.like]: `%${body.vehiculo}%` };
    }

    const include = [
      {
        model: db.vehiculo,
        required: Object.keys(vehiculoWhere).length > 0,
        where: Object.keys(vehiculoWhere).length > 0 ? vehiculoWhere : undefined,
      },
    ];

    const { rows: result, count: total } = await db.tanqueos.findAndCountAll({
      where,
      include,
      limit: pageLimit,
      offset: newOffset,
      order: [['fecha', 'DESC'], ['id', 'DESC']],
    });

    return { data: result, total };
  }
}

module.exports = tanqueosService
