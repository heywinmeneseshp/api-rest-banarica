const boom = require('@hapi/boom');
const { Op, where } = require('sequelize');
const db = require('../../models');
const { required } = require('joi');
const { registrarHistorialListado } = require('./listadoHistorial.helper');
const ConfigService = require('../configuracion.service');
const env = require('../../config/env');

const configService = new ConfigService();

class RechazoService {
  // Semana del rechazo, tomada del Listado de su contenedor (todas las lineas
  // de un contenedor comparten el mismo Embarque/semana en este sistema).
  async _obtenerSemanaRechazo(rechazo) {
    const listado = await db.Listado.findOne({
      where: { id_contenedor: rechazo.id_contenedor },
      include: [{ model: db.Embarque, include: [{ model: db.semanas }] }],
    });
    return listado?.Embarque?.semana?.consecutivo || null;
  }

  async _obtenerUltimaSemanaConDatos() {
    const listado = await db.Listado.findOne({
      where: { habilitado: true },
      order: [['id_contenedor', 'DESC'], ['fecha', 'DESC']],
      include: [{ model: db.Embarque, include: [{ model: db.semanas } ] }],
    });
    return listado?.Embarque?.semana?.consecutivo || null;
  }

  // Eliminar/restaurar un rechazo solo se permite si es de la semana actual o
  // de la ultima semana con datos registrados, para evitar tocar por error
  // inventario de semanas ya cerradas/antiguas.
  async _validarSemanaPermitida(rechazo) {
    const [semanaRechazo, ultimaConDatos, configSemana] = await Promise.all([
      this._obtenerSemanaRechazo(rechazo),
      this._obtenerUltimaSemanaConDatos(),
      configService.find('Semana', { syncWeeks: false }),
    ]);

    const semanaActual = configSemana?.[0]?.semana_actual !== undefined
      ? `S${String(configSemana[0].semana_actual).padStart(2, '0')}-${configSemana[0].anho_actual}`
      : null;

    const permitidas = new Set([semanaActual, ultimaConDatos].filter(Boolean));

    if (permitidas.size > 0 && semanaRechazo && !permitidas.has(semanaRechazo)) {
      throw boom.badRequest(
        `Este rechazo es de la semana ${semanaRechazo}, distinta a la actual o a la ultima con datos registrados. `
        + 'Solo se pueden eliminar o restaurar rechazos de esas semanas.'
      );
    }
  }

  // Avisa a Corbana (best-effort, nunca bloquea al usuario) que los rechazos
  // de una semana cambiaron, mandando el listado completo de rechazos
  // ACTIVOS (no eliminados) de esa semana — Corbana reemplaza por completo
  // lo que tenía guardado de esa semana con lo que llega acá (ver
  // rechazoCorteService.syncSemanaWebhook en api-rest-corbana).
  async _avisarCorbanaRechazos(semanaConsecutivo) {
    if (!semanaConsecutivo || !env.corbanaApiUrl || !env.corbanaApiKey) return;

    const rechazos = await db.Rechazo.findAll({
      where: { eliminado: false },
      include: [
        {
          model: db.Contenedor,
          required: true,
          include: [
            {
              model: db.Listado,
              required: true,
              include: [
                { model: db.Embarque, required: true, include: [{ model: db.semanas, required: true }] },
                { model: db.almacenes, as: 'almacen' },
              ],
            },
          ],
        },
        { model: db.combos },
      ],
    });

    const filas = rechazos
      .filter((r) => r.Contenedor?.Listados?.some((l) => l.Embarque?.semana?.consecutivo === semanaConsecutivo))
      .map((r) => {
        // Listado exacto del que salió/saldría esta fruta: mismo producto y
        // mismo productor que el rechazo (cod_productor_descuento si ya fue
        // aprobado, si no cod_productor — mismo criterio que
        // _resolverListadoDescuento). Su `fecha` es cuándo se llenó el
        // contenedor con esa fruta, es decir la fecha real de cosecha.
        const codProductor = r.cod_productor_descuento || r.cod_productor;
        const listado = r.Contenedor?.Listados?.find(
          (l) => l.id_producto === r.id_producto && l.almacen?.consecutivo === codProductor,
        );

        return {
          fechaRechazo: r.fecha_rechazo,
          fechaLlenado: listado?.fecha || undefined,
          fincaCodigo: r.cod_productor,
          productoNombre: r.combo?.nombre || '',
          cajas: r.cantidad,
          motivo: r.observaciones || undefined,
        };
      });

    const response = await fetch(`${env.corbanaApiUrl.replace(/\/$/, '')}/api/v1/rechazos-corte/webhook-sync-banarica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', api: env.corbanaApiKey },
      body: JSON.stringify({ semana: semanaConsecutivo, rechazos: filas }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }

  // Reenvía a Corbana los rechazos de una semana puntual, sin que haya
  // cambiado nada — para poblar el espejo con rechazos que ya existían
  // antes de que se agregara esta sincronización (que solo se dispara con
  // create/update/delete/aprobar/restaurar, no hay cargue retroactivo
  // automático).
  async backfillSemana(semanaConsecutivo) {
    await this._avisarCorbanaRechazos(semanaConsecutivo);
    return { message: `Rechazos de ${semanaConsecutivo} reenviados a Corbana` };
  }

  async create(data) {
    try {
      const rechazo = await db.Rechazo.create(data);
      const semana = await this._obtenerSemanaRechazo(rechazo);
      this._avisarCorbanaRechazos(semana).catch((error) => {
        console.error('No se pudo avisar a Corbana del cargue de Rechazos:', error.message);
      });
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

  // Encuentra (con SELECT FOR UPDATE) el Listado del que se descontaron/se
  // descontarian las cajas de un rechazo: el productor real es
  // cod_productor_descuento si quedo guardado, o cod_productor si no (rechazos
  // aprobados antes de que existiera esta columna).
  async _resolverListadoDescuento(rechazo, transaction) {
    const codProductorDescuento = rechazo.cod_productor_descuento || rechazo.cod_productor;

    const almacenDescuento = await db.almacenes.findOne({
      where: { consecutivo: codProductorDescuento },
      transaction,
    });
    if (!almacenDescuento) throw boom.notFound(`Productor "${codProductorDescuento}" no encontrado`);

    const listado = await db.Listado.findOne({
      where: {
        id_contenedor: rechazo.id_contenedor,
        id_producto: rechazo.id_producto,
        id_lugar_de_llenado: almacenDescuento.id,
      },
      include: [db.Contenedor],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!listado) throw boom.notFound('No se encontró el listado del productor y producto del rechazo');

    return listado;
  }

  // Si el rechazo ya esta aprobado y cambia la cantidad, hay que ajustar el
  // inventario ya descontado por la diferencia (no solo actualizar el numero).
  async update(id, changes, usuario = null) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }

    const cantidadNueva = changes?.cantidad !== undefined ? Number(changes.cantidad) : undefined;
    const cambiaCantidad = rechazo.habilitado
      && cantidadNueva !== undefined
      && cantidadNueva !== rechazo.cantidad;

    if (rechazo.habilitado && changes?.cod_productor && changes.cod_productor !== rechazo.cod_productor) {
      throw boom.badRequest(
        'No se puede cambiar el productor de un rechazo ya aprobado. Eliminalo (devuelve las cajas) y crea uno nuevo.'
      );
    }

    if (!cambiaCantidad) {
      await db.Rechazo.update(changes, { where: { id } });
      this._avisarCorbanaRechazos(await this._obtenerSemanaRechazo(rechazo)).catch((error) => {
        console.error('No se pudo avisar a Corbana de la edición del rechazo:', error.message);
      });
      return { message: 'El rechazo fue actualizado', id, changes };
    }

    const t = await db.sequelize.transaction();
    try {
      const listado = await this._resolverListadoDescuento(rechazo, t);
      const datosAnteriores = listado.toJSON();

      const diferencia = cantidadNueva - rechazo.cantidad;
      const nuevasCajas = listado.cajas_unidades - diferencia;
      if (nuevasCajas < 0) throw boom.badRequest(`Las cajas resultantes serían negativas (${nuevasCajas})`);

      await Promise.all([
        db.Rechazo.update(changes, { where: { id }, transaction: t }),
        db.Listado.update({ cajas_unidades: nuevasCajas }, { where: { id: listado.id }, transaction: t }),
      ]);

      await t.commit();

      await registrarHistorialListado({
        listado_id: listado.id,
        accion: 'editado',
        usuario,
        datosAnteriores,
        datosNuevos: { ...datosAnteriores, cajas_unidades: nuevasCajas },
        contenedorCodigo: datosAnteriores?.Contenedor?.contenedor || null,
      });

      this._avisarCorbanaRechazos(await this._obtenerSemanaRechazo(rechazo)).catch((error) => {
        console.error('No se pudo avisar a Corbana de la edición del rechazo:', error.message);
      });

      return { message: 'El rechazo fue actualizado', id, changes };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  // Borrado logico (no destruye el registro, para poder restaurarlo despues).
  // Si el rechazo ya estaba aprobado, devuelve al inventario las cajas que se
  // habian descontado. Solo se permite en la semana actual o la ultima con datos.
  async delete(id, usuario = null) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    if (rechazo.eliminado) {
      throw boom.badRequest('El rechazo ya esta eliminado');
    }

    await this._validarSemanaPermitida(rechazo);

    if (!rechazo.habilitado) {
      await db.Rechazo.update({ eliminado: true }, { where: { id } });
      this._avisarCorbanaRechazos(await this._obtenerSemanaRechazo(rechazo)).catch((error) => {
        console.error('No se pudo avisar a Corbana de la eliminación del rechazo:', error.message);
      });
      return { message: 'El rechazo fue eliminado', id };
    }

    const t = await db.sequelize.transaction();
    try {
      const listado = await this._resolverListadoDescuento(rechazo, t);
      const datosAnteriores = listado.toJSON();

      const nuevasCajas = listado.cajas_unidades + rechazo.cantidad;

      await Promise.all([
        db.Listado.update({ cajas_unidades: nuevasCajas }, { where: { id: listado.id }, transaction: t }),
        db.Rechazo.update({ eliminado: true }, { where: { id }, transaction: t }),
      ]);

      await t.commit();

      await registrarHistorialListado({
        listado_id: listado.id,
        accion: 'editado',
        usuario,
        datosAnteriores,
        datosNuevos: { ...datosAnteriores, cajas_unidades: nuevasCajas },
        contenedorCodigo: datosAnteriores?.Contenedor?.contenedor || null,
      });

      this._avisarCorbanaRechazos(await this._obtenerSemanaRechazo(rechazo)).catch((error) => {
        console.error('No se pudo avisar a Corbana de la eliminación del rechazo:', error.message);
      });

      return { message: 'El rechazo fue eliminado y las cajas devueltas al inventario', id, cajasDevueltas: rechazo.cantidad };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  // Restaura un rechazo eliminado. Si estaba aprobado al momento de eliminarlo,
  // vuelve a descontar el inventario (reversa lo que delete() devolvio).
  async restaurar(id, usuario = null) {
    const rechazo = await db.Rechazo.findByPk(id);
    if (!rechazo) {
      throw boom.notFound('El rechazo no existe');
    }
    if (!rechazo.eliminado) {
      throw boom.badRequest('El rechazo no esta eliminado');
    }

    await this._validarSemanaPermitida(rechazo);

    if (!rechazo.habilitado) {
      await db.Rechazo.update({ eliminado: false }, { where: { id } });
      this._avisarCorbanaRechazos(await this._obtenerSemanaRechazo(rechazo)).catch((error) => {
        console.error('No se pudo avisar a Corbana de la restauración del rechazo:', error.message);
      });
      return { message: 'El rechazo fue restaurado', id };
    }

    const t = await db.sequelize.transaction();
    try {
      const listado = await this._resolverListadoDescuento(rechazo, t);
      const datosAnteriores = listado.toJSON();

      const nuevasCajas = listado.cajas_unidades - rechazo.cantidad;
      if (nuevasCajas < 0) throw boom.badRequest(`Las cajas resultantes serían negativas (${nuevasCajas})`);

      await Promise.all([
        db.Listado.update({ cajas_unidades: nuevasCajas }, { where: { id: listado.id }, transaction: t }),
        db.Rechazo.update({ eliminado: false }, { where: { id }, transaction: t }),
      ]);

      await t.commit();

      await registrarHistorialListado({
        listado_id: listado.id,
        accion: 'editado',
        usuario,
        datosAnteriores,
        datosNuevos: { ...datosAnteriores, cajas_unidades: nuevasCajas },
        contenedorCodigo: datosAnteriores?.Contenedor?.contenedor || null,
      });

      this._avisarCorbanaRechazos(await this._obtenerSemanaRechazo(rechazo)).catch((error) => {
        console.error('No se pudo avisar a Corbana de la restauración del rechazo:', error.message);
      });

      return { message: 'El rechazo fue restaurado y las cajas descontadas de nuevo', id };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  // cod_productor: productor que queda registrado en el rechazo (puede no tener el
  // producto en el contenedor). cod_productor_descuento: productor del contenedor al
  // que realmente se le descuentan las cajas; si no se envia, se usa cod_productor.
  async aprobar(id, { cod_productor, cod_productor_descuento }, usuario = null) {
    const t = await db.sequelize.transaction();
    try {
      const rechazo = await db.Rechazo.findByPk(id, { transaction: t });
      if (!rechazo) throw boom.notFound('Rechazo no encontrado');
      if (rechazo.habilitado) throw boom.badRequest('El rechazo ya fue aprobado');

      const codProductorDescuento = cod_productor_descuento || cod_productor;

      // SELECT FOR UPDATE: leer cajas actuales evitando race conditions
      const listado = await this._resolverListadoDescuento(
        { ...rechazo.toJSON(), cod_productor_descuento: codProductorDescuento },
        t
      );

      const datosAnteriores = listado.toJSON();

      const nuevasCajas = listado.cajas_unidades - rechazo.cantidad;
      if (nuevasCajas < 0) throw boom.badRequest(`Las cajas resultantes serían negativas (${nuevasCajas})`);

      await Promise.all([
        db.Rechazo.update(
          { habilitado: true, cod_productor, cod_productor_descuento: codProductorDescuento },
          { where: { id }, transaction: t }
        ),
        db.Listado.update({ cajas_unidades: nuevasCajas }, { where: { id: listado.id }, transaction: t }),
      ]);

      await t.commit();

      // Se registra fuera de la transaccion: si el historial falla no debe
      // revertir la aprobacion del rechazo (registrarHistorialListado ya
      // atrapa sus propios errores).
      await registrarHistorialListado({
        listado_id: listado.id,
        accion: 'editado',
        usuario,
        datosAnteriores,
        datosNuevos: { ...datosAnteriores, cajas_unidades: nuevasCajas },
        contenedorCodigo: datosAnteriores?.Contenedor?.contenedor || null,
      });

      this._avisarCorbanaRechazos(await this._obtenerSemanaRechazo(rechazo)).catch((error) => {
        console.error('No se pudo avisar a Corbana de la aprobación del rechazo:', error.message);
      });

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

    // "eliminado" es explicito (false por defecto) para no mezclar rechazos
    // borrados en el listado normal; la vista "Ver eliminados" manda true.
    const whereConditions = { eliminado: body?.eliminado === true };

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
      col: 'id',
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

    const where = ['r.eliminado = ?'];
    const params = [body.eliminado ? 1 : 0];

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

    const joins = `
      FROM Rechazos r
      LEFT JOIN Contenedors ct ON r.id_contenedor = ct.id
      LEFT JOIN Listados l ON ct.id = l.id_contenedor AND l.id_producto = r.id_producto
      LEFT JOIN Embarques e ON l.id_embarque = e.id
      LEFT JOIN semanas s ON e.id_semana = s.id
      LEFT JOIN combos cp ON r.id_producto = cp.id
      LEFT JOIN MotivoDeRechazos mdr ON r.id_motivo_de_rechazo = mdr.id
      LEFT JOIN almacenes a ON r.cod_productor = a.consecutivo
      LEFT JOIN usuarios u ON r.id_usuario = u.id
    `;

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
      ${joins}
      WHERE ${where.join(' AND ')}
      ORDER BY r.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows, countRows] = await Promise.all([
      sequelize.query(sql + ';', { replacements: [...params, pLimit, pOffset], type: sequelize.QueryTypes.SELECT }),
      sequelize.query(
        `SELECT COUNT(*) AS total ${joins} WHERE ${where.join(' AND ')}`,
        { replacements: params, type: sequelize.QueryTypes.SELECT }
      )
    ]);

    return { data: rows, total: countRows[0]?.total || 0 };
  }
}

module.exports = RechazoService;
