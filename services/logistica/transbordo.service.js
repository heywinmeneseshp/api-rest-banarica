const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');
const MovimientoService = require('../movimientos.service');
const SeguridadService = require('../seguridad/seguridad.service');
const StockService = require('../stock.service');
const HistorialMovimientoService = require('../historialMovimientos.service');
const historialMovimientoService = new HistorialMovimientoService();
const movimientoService = new MovimientoService();
const seguridadService = new SeguridadService();
const stockService = new StockService();

class TransbordoService {

  async create(data) {
    const transaction = await db.sequelize.transaction();
    try {
      const {
        seriales,
        lineas_listado,
        nuevo_contenedor,
        cons_semana,
        id_contenedor_viejo,
        fecha_transbordo,
        observaciones,
        usuario,
        inspeccionado,
        rechazos
      } = data;

      const serialesNormalizados = Array.isArray(seriales) ? seriales.filter(Boolean) : [];
      const lineasNormalizadas = Array.isArray(lineas_listado) ? lineas_listado.filter(Boolean) : [];
      const nuevoContenedorNormalizado = String(nuevo_contenedor || '').trim().toUpperCase();
      const marcarComoInspeccionado = Boolean(inspeccionado);
      const rechazosNormalizados = Array.isArray(rechazos) ? rechazos.filter(Boolean) : [];

      if (!id_contenedor_viejo) {
        throw boom.badRequest('Debe indicar el contenedor de origen.');
      }

      if (!nuevoContenedorNormalizado) {
        throw boom.badRequest('Debe indicar el nuevo contenedor.');
      }

      if (!fecha_transbordo) {
        throw boom.badRequest('Debe indicar la fecha del transbordo.');
      }

      if (lineasNormalizadas.length === 0) {
        throw boom.badRequest('No hay lineas de listado para transbordar.');
      }

      if (serialesNormalizados.length === 0) {
        throw boom.badRequest('No hay seriales disponibles para el kit seleccionado.');
      }

      if (!usuario || !usuario.username || !usuario.id) {
        throw boom.badRequest('No fue posible identificar el usuario del transbordo.');
      }

      if (serialesNormalizados.some(item => !item || !item.serial || !item.cons_producto || !item.cons_almacen)) {
        throw boom.badRequest('Los seriales del kit no tienen la informacion completa para registrar el transbordo.');
      }


      if (rechazosNormalizados.some(item => !item || !item.producto || !item.cod_productor || !item.codigoPallet || !item.totalCajas)) {
        throw boom.badRequest('Todos los rechazos del transbordo deben tener productor, pallet, producto y cajas.');
      }
      // CREAR NUEVO CONTENEDOR
      const contenedorNuevo = await db.Contenedor.create({
        contenedor: nuevoContenedorNormalizado,
        habilitado: true
      }, { transaction });

      const id_contenedor_nuevo = contenedorNuevo.dataValues.id;

      // CREAR TRANSBORDO
      const transbordo = await db.Transbordo.create({
        id_contenedor_viejo,
        id_contenedor_nuevo,
        fecha_transbordo,
        habilitado: true
      }, { transaction });

      // ACTUALIZAR LISTADO
      await Promise.all(
        lineasNormalizadas.map(element =>
          db.Listado.update(
            { id_contenedor: id_contenedor_nuevo, transbordado: true },
            { where: { id: element.id }, transaction }
          )
        )
      );

      const motivoConsecutivo = marcarComoInspeccionado ? "INSP02" : "TRANS01";
      const motivoDescripcion = marcarComoInspeccionado ? "Inspeccion antinarcoticos" : "transbordo";

      // ENCONTRAR O CREAR MOTIVO DE USO
      const [moviUso] = await db.MotivoDeUso.findOrCreate({
        where: { consecutivo: motivoConsecutivo },
        defaults: {
          consecutivo: motivoConsecutivo,
          motivo_de_uso: motivoDescripcion,
          habilitado: true
        },
        transaction
      });

      let inspeccion = null;
      if (marcarComoInspeccionado) {
        const horaInspeccion = new Date().toISOString().slice(11, 19);
        inspeccion = await db.Inspeccion.create({
          id_contenedor: id_contenedor_nuevo,
          fecha_inspeccion: fecha_transbordo,
          hora_inicio: horaInspeccion,
          hora_fin: horaInspeccion,
          agente: usuario.username,
          zona: "Inspeccion antinarcoticos",
          observaciones: observaciones || "Contenedor marcado como inspeccionado durante transbordo.",
          habilitado: true
        }, { transaction });
      }

      // CREAR MOVIMIENTO
      const dataMovimiento = {
        prefijo: "EX",
        pendiente: false,
        observaciones,
        cons_semana,
        realizado_por: usuario.username,
        vehiculo: null,
        fecha: fecha_transbordo
      };

      const movimiento = await movimientoService.create(dataMovimiento, transaction);
      const cons_movimiento = movimiento.dataValues.consecutivo;
      const id_motivo_de_uso = moviUso.dataValues.id;
      const id_usuario = usuario.id;

      const [motivoRechazo] = await db.MotivoDeRechazo.findOrCreate({
        where: { motivo_rechazo: 'Transbordo' },
        defaults: {
          habilitado: true
        },
        transaction
      });

      if (inspeccion) {
        await db.Inspeccion.update(
          {
            cons_movimiento,
            observaciones: observaciones || "Contenedor marcado como inspeccionado durante transbordo."
          },
          {
            where: { id: inspeccion.id },
            transaction
          }
        );
      }

      if (rechazosNormalizados.length) {
        await Promise.all(
          rechazosNormalizados.map((item) =>
            db.Rechazo.create(
              {
                id_motivo_de_rechazo: motivoRechazo.id,
                id_producto: item.producto,
                cantidad: item.totalCajas,
                serial_palet: item.codigoPallet,
                cod_productor: item.cod_productor,
                id_contenedor: id_contenedor_nuevo,
                id_usuario,
                habilitado: false,
                observaciones: observaciones || null,
                fecha_rechazo: fecha_transbordo,
              },
              { transaction }
            )
          )
        );
      }

      // ACTUALIZAR SERIALES
      await Promise.all(serialesNormalizados.map(item => {
        const itemSerial = {
          serial: item.serial,
          cons_movimiento,
          available: false,
          id_contenedor: id_contenedor_nuevo,
          fecha_de_uso: fecha_transbordo,
          id_motivo_de_uso,
          id_usuario,
          ubicacion_en_contenedor: "Exterior"
        };
        return seguridadService.actualizarSerial(itemSerial, transaction);
      }));

      // CONTAR PRODUCTOS
      const conteo = serialesNormalizados.reduce((acc, item) => {
        const producto = item.cons_producto || 'Sin producto';
        acc[producto] = (acc[producto] || 0) + 1;
        return acc;
      }, {});

      // PROCESAR CONTEO DE PRODUCTOS
      const cons_almacen = serialesNormalizados[0].cons_almacen;
      await Promise.all(Object.entries(conteo).map(async ([producto, cantidad]) => {
        // ACTUALIZAR STOCK
        await stockService.addAmounts(cons_almacen, producto, { cantidad }, transaction);

        // CREAR HISTORIAL DE MOVIMIENTO
        const dataHistorial = {
          cons_movimiento,
          cons_producto: producto,
          cons_almacen_gestor: cons_almacen,
          cons_almacen_receptor: cons_almacen,
          cons_lista_movimientos: "EX",
          tipo_movimiento: "Salida",
          razon_movimiento: marcarComoInspeccionado ? "Inspeccion antinarcoticos por transbordo" : "Transbordo",
          cantidad,
          cons_pedido: null
        };
        await historialMovimientoService.create(dataHistorial, transaction);
      }));

      // COMMIT TRANSACTION
      await transaction.commit();
      return transbordo;

    } catch (error) {
      // ROLLBACK TRANSACTION IN CASE OF ERROR
      await transaction.rollback();
      throw boom.badRequest(error.message || 'Error al crear el transbordo');
    }
  }


  async find() {
    return db.Transbordo.findAll({
      include: [
        { model: db.Contenedor, as: 'contenedorViejo', attributes: ['id', 'contenedor', 'habilitado'] },
        { model: db.Contenedor, as: 'contenedorNuevo', attributes: ['id', 'contenedor', 'habilitado'] },
      ],
      order: [['fecha_transbordo', 'DESC'], ['createdAt', 'DESC']],
    });
  }

  async findOne(id) {
    const transbordo = await db.Transbordo.findByPk(id, {
      include: [
        { model: db.Contenedor, as: 'contenedorViejo', attributes: ['id', 'contenedor', 'habilitado'] },
        { model: db.Contenedor, as: 'contenedorNuevo', attributes: ['id', 'contenedor', 'habilitado'] },
      ],
    });
    if (!transbordo) {
      throw boom.notFound('El transbordo no existe');
    }
    return transbordo;
  }

  async update(id, changes) {
    const transbordo = await db.Transbordo.findByPk(id);
    if (!transbordo) {
      throw boom.notFound('El transbordo no existe');
    }
    await db.Transbordo.update(changes, { where: { id } });
    return { message: 'El transbordo fue actualizado', id, changes };
  }

  async delete(id) {
    const transbordo = await db.Transbordo.findByPk(id);
    if (!transbordo) {
      throw boom.notFound('El transbordo no existe');
    }
    await db.Transbordo.destroy({ where: { id } });
    return { message: 'El transbordo fue eliminado', id };
  }

  async paginate(
    offset,
    limit,
    contenedor_viejo = '',
    contenedor_nuevo = '',
    fecha_inicial = '',
    fecha_final = ''
  ) {
    const parsedOffset = (parseInt(offset) - 1) * parseInt(limit);
    const whereClause = {};
    const include = [
      {
        model: db.Contenedor,
        as: 'contenedorViejo',
        attributes: ['id', 'contenedor', 'habilitado'],
        ...(contenedor_viejo
          ? { where: { contenedor: { [Op.like]: `%${contenedor_viejo}%` } } }
          : {}),
      },
      {
        model: db.Contenedor,
        as: 'contenedorNuevo',
        attributes: ['id', 'contenedor', 'habilitado'],
        ...(contenedor_nuevo
          ? { where: { contenedor: { [Op.like]: `%${contenedor_nuevo}%` } } }
          : {}),
      },
    ];

    if (fecha_inicial || fecha_final) {
      whereClause.fecha_transbordo = {};
      if (fecha_inicial) {
        whereClause.fecha_transbordo[Op.gte] = new Date(`${fecha_inicial}T00:00:00.000Z`);
      }
      if (fecha_final) {
        whereClause.fecha_transbordo[Op.lte] = new Date(`${fecha_final}T23:59:59.999Z`);
      }
    }

    const [result, total] = await Promise.all([
      db.Transbordo.findAll({
        where: whereClause,
        include,
        limit: parseInt(limit),
        offset: parsedOffset,
        order: [['fecha_transbordo', 'DESC'], ['createdAt', 'DESC']],
      }),
      db.Transbordo.count({ where: whereClause, include, distinct: true, col: 'id' }),
    ]);

    return { data: result, total };
  }
}

module.exports = TransbordoService;


