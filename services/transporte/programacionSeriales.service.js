const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');
const MovimientoService = require('../movimientos.service');
const HistorialMovimientoService = require('../historialMovimientos.service');
const StockService = require('../stock.service');
const { ROLES, normalizeRole } = require('../../middlewares/auth.handler');

const movimientoService = new MovimientoService();
const historialMovimientoService = new HistorialMovimientoService();
const stockService = new StockService();

const MOTIVO_PROGRAMADOR = 'Uso Transportadora';
const MOTIVO_PROGRAMADOR_CONSECUTIVO = 'TRANS';

class ProgramacionSerialesService {
  normalizeRows(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.rows)) {
      return payload.rows;
    }
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    return [];
  }

  async resolveMotivoId(motivoRef, transaction) {
    if (motivoRef && /^\d+$/.test(String(motivoRef))) {
      return Number(motivoRef);
    }

    const motivoValue = String(motivoRef || MOTIVO_PROGRAMADOR).trim();
    const motivo = await db.MotivoDeUso.findOne({
      where: {
        [Op.or]: [
          { motivo_de_uso: motivoValue },
          { consecutivo: motivoValue }
        ]
      },
      transaction
    });

    if (motivo) {
      return motivo.id;
    }

    const createdMotivo = await db.MotivoDeUso.create(
      {
        consecutivo: MOTIVO_PROGRAMADOR_CONSECUTIVO,
        motivo_de_uso: MOTIVO_PROGRAMADOR,
        habilitado: true
      },
      { transaction }
    );

    return createdMotivo.id;
  }

  async resolveSerial(row, transaction) {
    if (row.serial_articulo_id || row.id_serial_articulo) {
      const serial = await db.serial_de_articulos.findByPk(row.serial_articulo_id || row.id_serial_articulo, { transaction });
      if (!serial) {
        throw boom.notFound(`El serial con ID ${row.serial_articulo_id || row.id_serial_articulo} no existe`);
      }
      return serial;
    }

    const serialValue = String(row.serial || row.bag_pack || '').trim();
    if (!serialValue) {
      throw boom.badRequest('Debes indicar serial_articulo_id, serial o bag_pack');
    }

    const serial = await db.serial_de_articulos.findOne({
      where: {
        [Op.or]: [
          { serial: serialValue },
          { bag_pack: serialValue }
        ]
      },
      transaction
    });

    if (!serial) {
      throw boom.notFound(`El serial ${serialValue} no existe`);
    }

    return serial;
  }

  async validateUserCanUseSerial(serial, user, transaction) {
    if (!user?.username) {
      throw boom.unauthorized('Debes iniciar sesion para usar seriales del programador');
    }

    if (normalizeRole(user.id_rol) === ROLES.SUPER_ADMIN) {
      return;
    }

    const consAlmacen = String(serial?.cons_almacen || '').trim();
    if (!consAlmacen) {
      throw boom.badRequest(`El serial ${serial?.bag_pack || serial?.serial || serial?.id} no tiene almacen asignado`);
    }

    const asignacion = await db.almacenes_por_usuario.findOne({
      where: {
        username: user.username,
        id_almacen: consAlmacen,
        habilitado: true
      },
      transaction
    });

    if (!asignacion) {
      throw boom.forbidden(`No tienes asignado el almacen ${consAlmacen} del serial ${serial?.bag_pack || serial?.serial}`);
    }
  }

  buildInclude() {
    return [
      {
        model: db.serial_de_articulos,
        as: 'serial_articulo',
        include: [
          { model: db.productos, as: 'producto' },
          { model: db.Contenedor, as: 'contenedor' },
          { model: db.MotivoDeUso },
          { model: db.usuarios, as: 'usuario' }
        ]
      },
      { model: db.Contenedor, as: 'contenedor' },
      { model: db.MotivoDeUso, as: 'motivo_de_uso' },
      { model: db.usuarios, as: 'usuario' }
    ];
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.programacion_id || filters.programacionId) {
      where.programacion_id = filters.programacion_id || filters.programacionId;
    }
    if (filters.serial_articulo_id || filters.serialArticuloId) {
      where.serial_articulo_id = filters.serial_articulo_id || filters.serialArticuloId;
    }
    if (filters.id_contenedor || filters.contenedorId) {
      where.id_contenedor = filters.id_contenedor || filters.contenedorId;
    }
    if (filters.activo !== undefined) {
      where.activo = filters.activo;
    }

    return db.programacion_serial.findAll({
      where,
      include: this.buildInclude(),
      order: [['createdAt', 'DESC']]
    });
  }

  async paginate(page, limit, filters = {}) {
    const rows = await this.findAll(filters);
    if (!page || !limit) {
      return { data: rows, total: rows.length };
    }

    const newLimit = parseInt(limit);
    const offset = (parseInt(page) - 1) * newLimit;
    return {
      data: rows.slice(offset, offset + newLimit),
      total: rows.length
    };
  }

  async create(body, user = null) {
    const result = await this.bulkCreate({ rows: [body] }, user);
    return result?.data?.[0] || result?.[0] || result;
  }

  async bulkCreate(payload, user = null) {
    const rows = this.normalizeRows(payload);
    if (!rows.length) {
      throw boom.badRequest('Debes enviar al menos un serial para relacionar');
    }

    const transaction = await db.sequelize.transaction();

    try {
      const firstRow = rows[0] || {};
      const programacion = await db.programacion.findByPk(firstRow.programacion_id || firstRow.programacionId, { transaction });
      if (!programacion) {
        throw boom.notFound('La linea del programador no existe');
      }

      const motivoId = await this.resolveMotivoId(
        firstRow.id_motivo_de_uso || firstRow.motivo_de_uso || MOTIVO_PROGRAMADOR,
        transaction
      );

      const movimiento = await movimientoService.create({
        prefijo: 'EX',
        pendiente: false,
        fecha: firstRow.fecha_uso || firstRow.fecha || programacion.fecha,
        cons_semana: firstRow.semana || programacion.semana,
      }, transaction);

      const relaciones = [];
      const serialesUsados = [];

      for (const row of rows) {
        const currentProgramacionId = row.programacion_id || row.programacionId;
        if (String(currentProgramacionId) !== String(programacion.id)) {
          throw boom.badRequest('Todos los seriales del lote deben pertenecer a la misma programacion');
        }

        const serial = await this.resolveSerial(row, transaction);
        await this.validateUserCanUseSerial(serial, user, transaction);
        if (serial.available === false) {
          throw boom.conflict(`El serial ${serial.bag_pack || serial.serial} no esta disponible`);
        }

        const [relacion] = await db.programacion_serial.findOrCreate({
          where: {
            programacion_id: programacion.id,
            serial_articulo_id: serial.id
          },
          defaults: {
            id_contenedor: row.id_contenedor || row.contenedorId || null,
            fecha_uso: row.fecha_uso || row.fecha || programacion.fecha,
            semana: row.semana || programacion.semana,
            id_motivo_de_uso: motivoId,
            id_usuario: row.id_usuario || row.usuarioId || null,
            activo: row.activo !== false
          },
          transaction
        });

        await db.serial_de_articulos.update({
          available: false,
          fecha_de_uso: row.fecha_uso || row.fecha || programacion.fecha,
          id_contenedor: row.id_contenedor || row.contenedorId || null,
          cons_movimiento: movimiento.consecutivo,
          ubicacion_en_contenedor: row.ubicacion_en_contenedor || 'Exterior',
          id_usuario: row.id_usuario || row.usuarioId || null,
          id_motivo_de_uso: motivoId,
        }, {
          where: { id: serial.id },
          transaction
        });

        relaciones.push(relacion);
        serialesUsados.push(serial);
      }

      const productosCantidad = serialesUsados.reduce((acc, serial) => {
        const producto = serial.cons_producto || 'Sin producto';
        acc[producto] = (acc[producto] || 0) + 1;
        return acc;
      }, {});

      await Promise.all(Object.entries(productosCantidad).map(async ([consProducto, cantidad]) => {
        const primerSerial = serialesUsados.find((serial) => serial.cons_producto === consProducto);
        if (!primerSerial?.cons_almacen) {
          return;
        }

        await stockService.subtractAmounts(primerSerial.cons_almacen, consProducto, { cantidad }, transaction);
        await historialMovimientoService.create({
          cons_movimiento: movimiento.consecutivo,
          cons_producto: consProducto,
          cons_almacen_gestor: primerSerial.cons_almacen,
          cons_almacen_receptor: primerSerial.cons_almacen,
          cons_lista_movimientos: 'EX',
          tipo_movimiento: 'Salida',
          razon_movimiento: MOTIVO_PROGRAMADOR,
          cantidad,
          cons_pedido: null
        }, transaction);
      }));

      await transaction.commit();

      return {
        message: 'Seriales relacionados con la programacion',
        data: await this.findAll({ programacion_id: programacion.id })
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id, changes) {
    const relacion = await db.programacion_serial.findByPk(id);
    if (!relacion) {
      throw boom.notFound('La relacion programacion-serial no existe');
    }

    await relacion.update(changes);
    return relacion.reload({ include: this.buildInclude() });
  }

  async delete(id) {
    const relacion = await db.programacion_serial.findByPk(id);
    if (!relacion) {
      throw boom.notFound('La relacion programacion-serial no existe');
    }

    await relacion.update({ activo: false });
    return { message: 'Relacion desactivada', id };
  }

  async resolveContenedorId(row, transaction) {
    if (row.id_contenedor || row.contenedorId) {
      return row.id_contenedor || row.contenedorId;
    }

    const programacion = await db.programacion.findByPk(row.programacion_id || row.programacionId, { transaction });
    const contenedorCodigo = String(row.contenedor || programacion?.contenedor || '').trim();
    if (!contenedorCodigo) {
      return null;
    }

    const contenedor = await db.Contenedor.findOne({
      where: { contenedor: contenedorCodigo },
      transaction
    });

    return contenedor?.id || null;
  }

  async vincularContenedores(payload) {
    const rows = this.normalizeRows(payload);
    if (!rows.length) {
      throw boom.badRequest('Debes enviar al menos una programacion para vincular');
    }

    const transaction = await db.sequelize.transaction();
    try {
      const updated = [];

      for (const row of rows) {
        const programacionId = row.programacion_id || row.programacionId;
        if (!programacionId) {
          continue;
        }

        const contenedorId = await this.resolveContenedorId(row, transaction);
        if (!contenedorId) {
          continue;
        }

        const relaciones = await db.programacion_serial.findAll({
          where: {
            programacion_id: programacionId,
            activo: true,
            id_contenedor: null
          },
          transaction
        });

        await Promise.all(relaciones.map(async (relacion) => {
          await relacion.update({ id_contenedor: contenedorId }, { transaction });
          await db.serial_de_articulos.update(
            { id_contenedor: contenedorId },
            { where: { id: relacion.serial_articulo_id }, transaction }
          );
          updated.push(relacion.id);
        }));
      }

      await transaction.commit();

      return {
        message: 'Contenedores vinculados a seriales del programador',
        total: updated.length,
        ids: updated
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = ProgramacionSerialesService;
