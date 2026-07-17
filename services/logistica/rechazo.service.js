const boom = require('@hapi/boom');
const { Op, where } = require('sequelize');
const db = require('../../models');
const { required } = require('joi');

class RechazoService {
  async create(data) {
    try {
      const rechazo = await db.Rechazo.create(data);
      return rechazo;
    } catch (error) {
      throw boom.badRequest(error.message || 'Error al crear el rechazo');
    }
  }

  async find() {
    return db.Rechazo.findAll();
  }

  async findOne(id) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    return rechazo;
  }

  async update(id, changes) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    await db.Rechazo.update(changes, { where: { id } });
    return { message: 'El rechazo fue actualizado', id, changes };
  }

  async delete(id) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    await db.Rechazo.destroy({ where: { id } });
    return { message: 'El rechazo fue eliminado', id };
  }

  async aprobar(id, { cod_productor }) {
    const t = await db.sequelize.transaction();
    try {
      const rechazo = await db.Rechazo.findByPk(id, { transaction: t });
      if (!rechazo) throw boom.notFound('Rechazo no encontrado');
      if (rechazo.habilitado) throw boom.badRequest('El rechazo ya fue aprobado');

      // Resolver id del almacen a partir del consecutivo
      const almacen = await db.almacenes.findOne({
        where: { consecutivo: cod_productor },
        transaction: t,
      });
      if (!almacen) throw boom.notFound(`Productor "${cod_productor}" no encontrado`);

      // SELECT FOR UPDATE: leer cajas actuales evitando race conditions
      const listado = await db.Listado.findOne({
        where: {
          id_contenedor: rechazo.id_contenedor,
          id_producto: rechazo.id_producto,
          id_lugar_de_llenado: almacen.id,
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!listado) throw boom.notFound('No se encontró el listado para el productor y producto indicados');

      const nuevasCajas = listado.cajas_unidades - rechazo.cantidad;
      if (nuevasCajas < 0) throw boom.badRequest(`Las cajas resultantes serían negativas (${nuevasCajas})`);

      await Promise.all([
        db.Rechazo.update({ habilitado: true, cod_productor }, { where: { id }, transaction: t }),
        db.Listado.update({ cajas_unidades: nuevasCajas }, { where: { id: listado.id }, transaction: t }),
      ]);

      await t.commit();
      return { message: 'Rechazo aprobado', nuevasCajas };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }




async paginate(offset, limit, body) {
  try {
    const parsedLimit = parseInt(limit, 10) || 10;
    const currentPage = parseInt(offset, 10) || 1;
    const parsedOffset = (currentPage - 1) * parsedLimit;

    const { semana, productor, contenedor, producto } = body;

    const whereConditions = {}; 

    const includes = [
      {
        model: db.Contenedor,
        // CRUCIAL: Si hay semana, el Contenedor TIENE que ser obligatorio
        required: !!(semana || contenedor), 
        where: contenedor ? { contenedor: { [Op.like]: `%${contenedor}%` } } : {},
        include: [
          {
            model: db.Listado,
            // CRUCIAL: Si hay semana, el Listado TIENE que ser obligatorio
            required: !!semana, 
            include: [
              {
                model: db.Embarque,
                // Si pones el where aquí, Sequelize debería filtrar, 
                // pero usamos !!semana para forzar el INNER JOIN
                required: !!semana, 
                where: semana ? { id_semana: semana } : {}, 
                include: [ { model: db.semanas } ]
              },
              { model: db.combos },
              { model: db.almacenes, as: "almacen" }
            ]
          }
        ]
      },
      { model: db.MotivoDeRechazo },
      { model: db.usuarios },
      { 
        model: db.almacenes, 
        where: productor ? { nombre: { [Op.like]: `%${productor}%` } } : {},
        required: !!productor // Si buscas productor y no hay match, elimina el Rechazo
      },
      { 
        model: db.combos,
        where: producto ? { nombre: { [Op.like]: `%${producto}%` } } : {},
        required: !!producto // Si buscas producto y no hay match, elimina el Rechazo
      }
    ];

    const { count, rows } = await db.Rechazo.findAndCountAll({
      limit: parsedLimit,
      offset: parsedOffset,
      where: whereConditions,
      include: includes,
      order: [['id', 'DESC']],
      distinct: true,
      col: 'Rechazo.id',
      subQuery: false
    });

    return {
      data: rows,
      total: count,
      currentPage,
      totalPages: Math.ceil(count / parsedLimit)
    };

  } catch (error) {
    console.error("Error en la paginación de Rechazos:", error.message);
    throw error;
  }
  }

  async exportExcel(offset, limit, body = {}) {
    const sequelize = db.sequelize;
    const pLimit = Number(limit) || 500;
    const pOffset = Number(offset) ? (Number(offset) - 1) * pLimit : 0;

    const where = ['1=1'];
    const params = [];

    if (body.fecha_inicial) {
      where.push('r.fecha_rechazo >= ?');
      params.push(body.fecha_inicial);
    }
    if (body.fecha_final) {
      where.push('r.fecha_rechazo <= ?');
      params.push(body.fecha_final + ' 23:59:59');
    }
    if (body.habilitado !== undefined) {
      where.push('r.habilitado = ?');
      params.push(body.habilitado ? 1 : 0);
    }
    if (body.contenedor) {
      where.push('ct.contenedor LIKE ?');
      params.push(`%${body.contenedor}%`);
    }
    if (body.producto) {
      where.push('cp.nombre LIKE ?');
      params.push(`%${body.producto}%`);
    }
    if (body.productor) {
      where.push('a.nombre LIKE ?');
      params.push(`%${body.productor}%`);
    }
    if (body.motivo) {
      where.push('mdr.motivo_rechazo LIKE ?');
      params.push(`%${body.motivo}%`);
    }
    if (body.semana) {
      where.push('s.consecutivo LIKE ?');
      params.push(`%${body.semana}%`);
    }
    if (body.booking) {
      where.push('e.booking LIKE ?');
      params.push(`%${body.booking}%`);
    }

    const sql = `
      SELECT
        r.id, r.fecha_rechazo, r.cantidad, r.serial_palet, r.observaciones,
        ct.contenedor,
        cp.nombre AS producto,
        mdr.motivo_rechazo,
        a.nombre AS productor,
        u.nombre AS usuario,
        l.fecha AS fecha_listado,
        e.booking,
        s.consecutivo AS sem
      FROM Rechazos r
      LEFT JOIN Contenedors ct ON r.id_contenedor = ct.id
      LEFT JOIN Listados l ON ct.id = l.id_contenedor
      LEFT JOIN Embarques e ON l.id_embarque = e.id
      LEFT JOIN semanas s ON e.id_semana = s.id
      LEFT JOIN combos cp ON r.id_producto = cp.id
      LEFT JOIN MotivoDeRechazos mdr ON r.id_motivo_de_rechazo = mdr.id
      LEFT JOIN almacenes a ON r.cod_productor = a.consecutivo
      LEFT JOIN usuarios u ON r.id_usuario = u.id
      WHERE ${where.join(' AND ')}
      ORDER BY r.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows, countRows] = await Promise.all([
      sequelize.query(sql + ';', { replacements: [...params, pLimit, pOffset], type: sequelize.QueryTypes.SELECT }),
      sequelize.query(
        `SELECT COUNT(*) AS total FROM Rechazos r WHERE ${where.join(' AND ')}`,
        { replacements: params, type: sequelize.QueryTypes.SELECT }
      )
    ]);

    return { data: rows, total: countRows[0]?.total || 0 };
  }
}

module.exports = RechazoService;
