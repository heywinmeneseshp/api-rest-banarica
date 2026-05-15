const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');

class InspeccionService {
  async create(data) {
    try {
      return await db.Inspeccion.create(data);
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear la inspeccion');
    }
  }

  async find() {
    return db.Inspeccion.findAll();
  }

  async findOne(id) {
    const inspeccion = await db.Inspeccion.findByPk(id);
    if (!inspeccion) {
      throw boom.notFound('La inspeccion no existe');
    }
    return inspeccion;
  }

  async update(id, changes) {
    const inspeccion = await db.Inspeccion.findByPk(id);
    if (!inspeccion) {
      throw boom.notFound('La inspeccion no existe');
    }
    await db.Inspeccion.update(changes, { where: { id } });
    return { message: 'La inspeccion fue actualizada', id, changes };
  }

  async delete(id) {
    const inspeccion = await db.Inspeccion.findByPk(id);
    if (!inspeccion) {
      throw boom.notFound('La inspeccion no existe');
    }
    await db.Inspeccion.destroy({ where: { id } });
    return { message: 'La inspeccion fue eliminada', id };
  }

  buildDateRange(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) {
      return null;
    }

    const inicio = new Date(fechaInicio);
    inicio.setUTCHours(0, 0, 0, 0);

    const fin = new Date(fechaFin);
    fin.setUTCHours(23, 59, 59, 999);

    return {
      [Op.between]: [inicio.toISOString(), fin.toISOString()]
    };
  }

  async findFilteredContainerIds({ contenedor, cons_producto, cons_almacen }) {
    let containerIds = null;

    if (contenedor) {
      const contenedores = await db.Contenedor.findAll({
        attributes: ['id'],
        where: {
          contenedor: { [Op.like]: `%${contenedor}%` }
        },
        raw: true
      });

      const ids = contenedores.map((item) => item.id);
      if (ids.length === 0) {
        return [];
      }
      containerIds = ids;
    }

    if (cons_producto || cons_almacen) {
      const serialWhere = {
        available: false
      };

      if (cons_producto) serialWhere.cons_producto = cons_producto;
      if (cons_almacen) serialWhere.cons_almacen = cons_almacen;
      if (Array.isArray(containerIds)) serialWhere.id_contenedor = { [Op.in]: containerIds };

      const seriales = await db.serial_de_articulos.findAll({
        attributes: ['id_contenedor'],
        where: serialWhere,
        include: [{
          model: db.MotivoDeUso,
          where: { consecutivo: 'INSP02' },
          required: true
        }],
        group: ['id_contenedor'],
        raw: true
      });

      const ids = seriales.map((item) => item.id_contenedor).filter(Boolean);
      if (ids.length === 0) {
        return [];
      }

      containerIds = ids;
    }

    return containerIds;
  }

  mergeContainerIdFilters(currentIds, nextIds) {
    if (!Array.isArray(nextIds)) {
      return currentIds;
    }

    const normalizedNext = [...new Set(nextIds.filter(Boolean))];
    if (currentIds === null) {
      return normalizedNext;
    }

    return currentIds.filter((id) => normalizedNext.includes(id));
  }

  extractInspectionMovement(observaciones = '') {
    const match = String(observaciones || '').match(/\[MOVIMIENTO:([^\]]+)\]/);
    return match ? match[1].trim() : null;
  }

  getInspectionMovementReference(inspeccion) {
    if (!inspeccion) {
      return null;
    }

    return inspeccion.cons_movimiento || this.extractInspectionMovement(inspeccion.observaciones);
  }

  async enrichInspectionRows(rows) {
    if (!rows.length) {
      return [];
    }

    const containerIds = [...new Set(rows.map((item) => item.id_contenedor).filter(Boolean))];
    const movementIds = [...new Set(rows.map((item) => this.getInspectionMovementReference(item)).filter(Boolean))];

    const inspectionUserIds = [...new Set(rows.map((item) => item.id_usuario).filter(Boolean))];

    const [contenedores, serialesPorMovimiento, serialesFallbackContenedor, movimientos, listados, inspectionUsers] = await Promise.all([
      db.Contenedor.findAll({
        where: { id: { [Op.in]: containerIds } },
        raw: true
      }),
      movementIds.length > 0
        ? db.serial_de_articulos.findAll({
            where: {
              cons_movimiento: { [Op.in]: movementIds },
              available: false
            },
            include: [
              {
                model: db.MotivoDeUso,
                where: { consecutivo: 'INSP02' },
                required: true
              },
              {
                model: db.usuarios,
                as: 'usuario',
                required: false
              },
              {
                model: db.movimientos,
                as: 'movimiento',
                required: false
              }
            ],
            order: [['updatedAt', 'DESC'], ['id', 'DESC']]
          })
        : [],
      db.serial_de_articulos.findAll({
        where: {
          id_contenedor: { [Op.in]: containerIds },
          available: false
        },
        include: [
          {
            model: db.MotivoDeUso,
            where: { consecutivo: 'INSP02' },
            required: true
          },
          {
            model: db.usuarios,
            as: 'usuario',
            required: false
          },
          {
            model: db.movimientos,
            as: 'movimiento',
            required: false
          }
        ],
        order: [['updatedAt', 'DESC'], ['id', 'DESC']]
      }),
      movementIds.length > 0
        ? db.movimientos.findAll({
            where: { consecutivo: { [Op.in]: movementIds } },
            raw: true
          })
        : [],
      db.Listado.findAll({
        where: {
          id_contenedor: { [Op.in]: containerIds }
        },
        include: [{
          model: db.Embarque,
          include: [{
            model: db.semanas
          }]
        }],
        order: [['updatedAt', 'DESC'], ['id', 'DESC']]
      }),
      inspectionUserIds.length > 0
        ? db.usuarios.findAll({
            where: { id: { [Op.in]: inspectionUserIds } },
            raw: true
          })
        : []
    ]);

    const contenedorMap = new Map(contenedores.map((item) => [item.id, item]));
    const movimientoMap = new Map(movimientos.map((item) => [item.consecutivo, item]));
    const inspectionUserMap = new Map(inspectionUsers.map((item) => [item.id, item]));

    const serialesPorMovimientoMap = new Map();
    for (const serial of serialesPorMovimiento) {
      const key = serial.cons_movimiento;
      const list = serialesPorMovimientoMap.get(key) || [];
      list.push(serial);
      serialesPorMovimientoMap.set(key, list);
    }

    const serialesPorContenedorMap = new Map();
    for (const serial of serialesFallbackContenedor) {
      const list = serialesPorContenedorMap.get(serial.id_contenedor) || [];
      list.push(serial);
      serialesPorContenedorMap.set(serial.id_contenedor, list);
    }

    const listadoPorContenedorMap = new Map();
    for (const listado of listados) {
      const current = listadoPorContenedorMap.get(listado.id_contenedor);
      if (!current) {
        listadoPorContenedorMap.set(listado.id_contenedor, listado);
      }
    }

    return rows.map((item) => {
      const inspection = item.toJSON();
      const listadoRelacionado = listadoPorContenedorMap.get(item.id_contenedor) || null;
      const embarque = listadoRelacionado?.Embarque?.toJSON?.() || null;
      const consMovimiento = this.getInspectionMovementReference(item);
      const serialesInspeccion =
        (consMovimiento ? serialesPorMovimientoMap.get(consMovimiento) : null)
        || serialesPorContenedorMap.get(item.id_contenedor)
        || [];
      const serialReferencia = serialesInspeccion[0] || null;
      const movimiento = consMovimiento ? (movimientoMap.get(consMovimiento) || serialReferencia?.movimiento?.toJSON?.() || null) : (serialReferencia?.movimiento?.toJSON?.() || null);
      const usuario = inspectionUserMap.get(item.id_usuario) || serialReferencia?.usuario?.toJSON?.() || null;
      const contenedor = contenedorMap.get(item.id_contenedor) || null;
      const motivoDeUso = {
        consecutivo: 'INSP02',
        motivo_de_uso: 'Inspeccion antinarcoticos'
      };

      return {
        id: inspection.id,
        ...inspection,
        Inspeccion: inspection,
        contenedor,
        Contenedor: contenedor,
        serial: serialReferencia?.bag_pack || serialReferencia?.serial || null,
        bag_pack: serialReferencia?.bag_pack || null,
        serial_referencia: serialReferencia?.serial || null,
        total_seriales: serialesInspeccion.length,
        usuario,
        MotivoDeUso: motivoDeUso,
        listado: listadoRelacionado?.toJSON?.() || null,
        Embarque: embarque,
        semana: embarque?.semana || null,
        movimiento,
        cons_movimiento: movimiento?.consecutivo || consMovimiento || null,
        updatedAt: serialReferencia?.updatedAt || inspection.updatedAt,
        available: false
      };
    });
  }

  async paginate(offset, limit, body = {}) {
    const {
      semana,
      contenedor,
      cons_producto,
      cons_almacen,
      fecha_inspeccion_inicio,
      fecha_inspeccion_fin
    } = body;

    const containerIds = await this.findFilteredContainerIds({
      contenedor,
      cons_producto,
      cons_almacen
    });

    let filteredContainerIds = containerIds;

    if (semana) {
      const listadosSemana = await db.Listado.findAll({
        attributes: ['id_contenedor'],
        include: [{
          model: db.Embarque,
          required: true,
          include: [{
            model: db.semanas,
            required: true,
            where: {
              consecutivo: { [Op.like]: `%${semana}%` }
            }
          }]
        }],
        raw: true
      });

      filteredContainerIds = this.mergeContainerIdFilters(
        filteredContainerIds,
        listadosSemana.map((item) => item.id_contenedor)
      );
    }

    if (Array.isArray(filteredContainerIds) && filteredContainerIds.length === 0) {
      return { data: [], total: 0 };
    }

    const where = {};
    if (Array.isArray(filteredContainerIds)) {
      where.id_contenedor = { [Op.in]: filteredContainerIds };
    }

    const dateRange = this.buildDateRange(fecha_inspeccion_inicio, fecha_inspeccion_fin);
    if (dateRange) {
      where.fecha_inspeccion = dateRange;
    }

    const parsedLimit = parseInt(limit, 10) || 25;
    const page = parseInt(offset, 10) || 1;
    const parsedOffset = (page - 1) * parsedLimit;

    const { count, rows } = await db.Inspeccion.findAndCountAll({
      where,
      limit: parsedLimit,
      offset: parsedOffset,
      order: [['fecha_inspeccion', 'DESC'], ['hora_inicio', 'DESC'], ['id', 'DESC']]
    });

    const data = await this.enrichInspectionRows(rows);
    return { data, total: count };
  }
}

module.exports = InspeccionService;
