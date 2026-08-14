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

  // Estadisticas de inspeccionados vs exportados, agrupables por anio,
  // destino, naviera y cliente (o cualquier combinacion de estos).
  // "Exportado": contenedor con al menos un Listado ligado a un Embarque.
  // "Inspeccionado": ese mismo contenedor tiene una Inspeccion aprobada
  // (habilitado=true) que no sea de zona "vacio" (coincide con el filtro
  // que ya usa el listado de Unidades Inspeccionadas).
  async estadisticas({ groupBy = ['anio'], anio } = {}) {
    // El año se toma de semanas.anho (campo propio de la semana), no de la fecha de
    // zarpe del embarque: esa fecha suele venir vacia en muchos registros y los
    // dejaba fuera del reporte (o los agrupaba mal, ej. como si fueran de 1970).
    const DIMENSIONES = {
      anio: { select: 's.anho', alias: 'anio', orderBy: 's.anho' },
      semana: { select: 's.consecutivo', alias: 'semana', orderBy: 'MIN(s.fecha_inicio)' },
      destino: { select: 'd.cod', alias: 'destino' },
      naviera: { select: 'n.cod', alias: 'naviera' },
      cliente: { select: 'c.cod', alias: 'cliente' },
    };

    const solicitadas = (Array.isArray(groupBy) ? groupBy : [groupBy]).filter((dim) => DIMENSIONES[dim]);
    const dimensiones = solicitadas.length > 0 ? solicitadas : ['anio'];

    const selectDimensiones = dimensiones
      .map((dim) => `${DIMENSIONES[dim].select} AS ${DIMENSIONES[dim].alias}`)
      .join(', ');
    const groupByClause = dimensiones.map((dim) => DIMENSIONES[dim].select).join(', ');
    const orderByClause = dimensiones
      .map((dim) => DIMENSIONES[dim].orderBy || DIMENSIONES[dim].select)
      .join(', ');

    const replacements = {};
    let whereClause = 's.anho IS NOT NULL';
    if (anio) {
      whereClause += ' AND s.anho = :anio';
      replacements.anio = anio;
    }

    const sql = `
      SELECT
        ${selectDimensiones},
        COUNT(DISTINCT ct.id) AS exportados,
        COUNT(DISTINCT CASE WHEN i.id_contenedor IS NOT NULL THEN ct.id END) AS inspeccionados
      FROM Listados l
      INNER JOIN Contenedors ct ON l.id_contenedor = ct.id
      INNER JOIN Embarques e ON l.id_embarque = e.id
      LEFT JOIN Destinos d ON e.id_destino = d.id
      LEFT JOIN Navieras n ON e.id_naviera = n.id
      LEFT JOIN clientes c ON e.id_cliente = c.id
      LEFT JOIN semanas s ON e.id_semana = s.id
      LEFT JOIN (
        SELECT DISTINCT id_contenedor
        FROM Inspeccions
        WHERE habilitado = true AND (zona IS NULL OR zona NOT LIKE '%vacio%')
      ) i ON i.id_contenedor = ct.id
      WHERE ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY ${orderByClause}
    `;

    const rows = await db.sequelize.query(sql, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT,
    });

    return rows.map((row) => {
      const exportados = Number(row.exportados) || 0;
      const inspeccionados = Number(row.inspeccionados) || 0;
      return {
        ...row,
        exportados,
        inspeccionados,
        porcentaje: exportados > 0 ? Number(((inspeccionados / exportados) * 100).toFixed(1)) : 0,
      };
    });
  }
}

module.exports = InspeccionService;
