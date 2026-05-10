const boom = require('@hapi/boom');
const db = require('../../models');
const { Op, where, json } = require('sequelize');
const serial_de_articulos = require('../../models/serial_de_articulos');
const { ROLES, normalizeRole } = require('../../middlewares/auth.handler');
const StockService = require('../stock.service');
const MovimientoService = require('../movimientos.service');
const HistorialMovimientosServiceService = require('../historialMovimientos.service');
const EmailService = require('../email.service');
const stockService = new StockService();
const historialMovimientoService = new HistorialMovimientosServiceService();
const movimientoService = new MovimientoService();
const emailService = new EmailService();
const INSPECCION_LLENO_ALERT_MODULE = 'Inspeccion_lleno_alertas';


class SeguridadService {
  parseConfigDetails(detalles, fallback = {}) {
    if (!detalles) return fallback;
    if (typeof detalles === 'object') return detalles;

    try {
      return JSON.parse(detalles);
    } catch (error) {
      return fallback;
    }
  }

  async hasConfiguredButton(user, buttonName) {
    const normalizedRole = normalizeRole(user && user.id_rol);

    if (normalizedRole === ROLES.SUPER_ADMIN) {
      return true;
    }

    if (normalizedRole !== ROLES.OPERADOR || !user || !user.username) {
      return false;
    }

    const config = await db.configuracion.findOne({ where: { modulo: user.username } });
    const details = this.parseConfigDetails(config && config.detalles, {});
    const buttons = Array.isArray(details && details.botones) ? details.botones : [];

    return buttons.includes(buttonName);
  }

  async canCorrectSerials(user) {
    return this.hasConfiguredButton(user, 'disponibles_corregir_serial');
  }

  async canCorrectInspectedContainer(user) {
    return this.hasConfiguredButton(user, 'inspeccionados_corregir_contenedor');
  }

  async canBulkUploadEmptyInspection(user) {
    return this.hasConfiguredButton(user, 'inspeccion_vacio_cargue_masivo');
  }

  async canApproveFullInspection(user) {
    return normalizeRole(user && user.id_rol) === ROLES.SUPER_ADMIN;
  }

  async getFullInspectionAlertRecipients() {
    const config = await db.configuracion.findOne({
      where: { modulo: INSPECCION_LLENO_ALERT_MODULE }
    });
    const details = this.parseConfigDetails(config && config.detalles, {});
    return String(details && details.correos_alerta ? details.correos_alerta : '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  buildPendingFullInspectionEmail(formulario, user, previousFullInspectionCount) {
    const contenedor = String(formulario && formulario.contenedor ? formulario.contenedor : '').trim();
    const fecha = String(formulario && formulario.fecha ? formulario.fecha : '').trim();
    const agente = String(formulario && formulario.agente ? formulario.agente : '').trim();
    const zona = String(formulario && formulario.zona ? formulario.zona : '').trim();
    const usuario = String(user && user.username ? user.username : 'Usuario no identificado').trim();
    const numeroInspeccion = previousFullInspectionCount + 1;

    return {
      asunto: 'Inspección lleno pendiente por aprobación',
      cuerpo: `
        <h3>Inspección lleno pendiente por aprobación</h3>
        <p>Se registró una inspección lleno que requiere autorización de Super administrador.</p>
        <ul>
          <li><strong>Contenedor:</strong> ${contenedor || 'N/A'}</li>
          <li><strong>Fecha de inspección:</strong> ${fecha || 'N/A'}</li>
          <li><strong>Número de inspección:</strong> ${numeroInspeccion}</li>
          <li><strong>Agente:</strong> ${agente || 'N/A'}</li>
          <li><strong>Zona:</strong> ${zona || 'N/A'}</li>
          <li><strong>Registrada por:</strong> ${usuario}</li>
        </ul>
        <p>Por favor revise la inspección en el módulo de Inspeccionados.</p>
      `
    };
  }

  async notifyPendingFullInspectionApproval(formulario, user, previousFullInspectionCount) {
    try {
      const destinatarios = await this.getFullInspectionAlertRecipients();
      if (destinatarios.length === 0) {
        return;
      }

      const emailPayload = this.buildPendingFullInspectionEmail(
        formulario,
        user,
        previousFullInspectionCount
      );

      await emailService.send({
        destinatario: destinatarios.join(','),
        asunto: emailPayload.asunto,
        cuerpo: emailPayload.cuerpo
      });
    } catch (error) {
      console.error('No fue posible enviar la alerta por correo de inspección lleno pendiente:', error);
    }
  }

  buildInspectionObservation(observaciones, consMovimiento) {
    const base = String(observaciones || '').trim();
    const marker = `[MOVIMIENTO:${consMovimiento}]`;
    return base ? `${base}\n${marker}` : marker;
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

  extractVisibleObservation(observaciones = '') {
    return String(observaciones || '').replace(/\s*\[MOVIMIENTO:[^\]]+\]\s*/g, ' ').trim();
  }

  getEmptyInspectionRowValue(row = {}, candidates = []) {
    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined) continue;
      const value = row[candidate];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }

    return '';
  }

  normalizeEmptyInspectionDate(value) {
    const rawValue = String(value || '').trim();
    if (!rawValue) {
      throw boom.badRequest('Debes indicar la fecha de la inspeccion.');
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
      return rawValue;
    }

    const parsedDate = new Date(rawValue);
    if (Number.isNaN(parsedDate.getTime())) {
      throw boom.badRequest('La fecha ' + rawValue + ' no es valida.');
    }

    return parsedDate.toISOString().slice(0, 10);
  }

  async ensureEmptyInspectionDefaults(transaction) {
    const defaults = {
      destino: { pais: 'Predeterminado', cod: 'PRE', habilitado: true },
      naviera: { cod: 'PRE', habilitado: true },
      buque: { habilitado: true },
      cliente: {
        razon_social: 'Predeterminado',
        nit: 999999999,
        domicilio: 'Calle predeterminada',
        telefono: 3000000000,
        email: 'predeterminado@default.ex',
        activo: true,
        pais: 'Predeterminado'
      },
      semana: { semana: 0, anho: 2000 },
      embarque: {
        viaje: 'N/A', anuncio: 'N/A', sae: 'N/A', booking: 'N/A', bl: 'N/A',
        fecha_zarpe: '2024-01-01 00:00:00', fecha_arribo: '2024-01-01 00:00:00',
        observaciones: '', habilitado: true
      },
      producto: { nombre: 'Predeterminado', isBlock: false },
      almacen: { nombre: 'Predeterminado', isBlock: false }
    };

    const [destino] = await db.Destino.findOrCreate({
      where: { destino: 'Predeterminado' },
      defaults: defaults.destino,
      transaction
    });
    const [naviera] = await db.Naviera.findOrCreate({
      where: { navieras: 'Predeterminado' },
      defaults: defaults.naviera,
      transaction
    });
    const [buque] = await db.Buque.findOrCreate({
      where: { buque: 'Predeterminado', id_naviera: naviera.id },
      defaults: defaults.buque,
      transaction
    });
    const [cliente] = await db.clientes.findOrCreate({
      where: { cod: 'PRE' },
      defaults: defaults.cliente,
      transaction
    });
    const [semana] = await db.semanas.findOrCreate({
      where: { consecutivo: 'S00-2000' },
      defaults: defaults.semana,
      transaction
    });
    const [combo] = await db.combos.findOrCreate({
      where: { consecutivo: 'PRE' },
      defaults: defaults.producto,
      transaction
    });
    const [almacen] = await db.almacenes.findOrCreate({
      where: { consecutivo: 'PRE' },
      defaults: defaults.almacen,
      transaction
    });
    const [embarque] = await db.Embarque.findOrCreate({
      where: { booking: 'N/A' },
      defaults: {
        ...defaults.embarque,
        id_semana: semana.id,
        id_cliente: cliente.id,
        id_destino: destino.id,
        id_naviera: naviera.id,
        id_buque: buque.id
      },
      transaction
    });

    return { embarque, combo, almacen };
  }

  async createEmptyInspectionMassiveRow(payload, user) {
    const transaction = await db.sequelize.transaction();

    try {
      const {
        semana,
        fecha,
        contenedor,
        seriales,
        observaciones,
        agente,
        hora_inicio,
        hora_fin,
        zona
      } = payload;
      const normalizedSerials = (Array.isArray(seriales) ? seriales : [])
        .map((item) => String(item || '').trim().toUpperCase())
        .filter(Boolean);

      if (!semana || !fecha || !contenedor) {
        throw boom.badRequest('Debes indicar semana, fecha y contenedor para la inspeccion vacio.');
      }

      if (normalizedSerials.length === 0) {
        throw boom.badRequest('Debes enviar al menos un serial para la inspeccion vacio.');
      }

      const duplicates = [...new Set(normalizedSerials.filter((item, index) => normalizedSerials.indexOf(item) !== index))];
      if (duplicates.length > 0) {
        throw boom.conflict('La fila contiene seriales repetidos: ' + duplicates.join(', '));
      }

      const { embarque, combo, almacen } = await this.ensureEmptyInspectionDefaults(transaction);

      const [motivoDeUso] = await db.MotivoDeUso.findOrCreate({
        where: { consecutivo: 'INSP01' },
        defaults: { consecutivo: 'INSP01', motivo_de_uso: 'Inspeccion vacio', habilitado: true },
        transaction
      });

      const contenedorRecord = await db.Contenedor.create({
        contenedor,
        habilitado: true
      }, { transaction });

      const serialRecords = await db.serial_de_articulos.findAll({
        where: {
          bag_pack: { [Op.in]: normalizedSerials },
          available: true
        },
        transaction
      });

      const foundBagPacks = serialRecords.map((item) => String(item.bag_pack).trim());
      const missingSerials = normalizedSerials.filter((item) => !foundBagPacks.includes(item));
      if (missingSerials.length > 0) {
        throw boom.badRequest('No se encontraron disponibles todos los seriales requeridos: ' + missingSerials.join(', '));
      }

      const movimiento = await movimientoService.create({
        prefijo: 'EX',
        pendiente: false,
        observaciones,
        cons_semana: semana,
        realizado_por: user && user.username ? user.username : null,
        aprobado_por: user && user.username ? user.username : null,
        vehiculo: 'N/A',
        fecha
      }, transaction);

      const serialesActualizados = await Promise.all(serialRecords.map(async (item) => {
        const payloadSerial = {
          serial: item.serial,
          cons_movimiento: movimiento.dataValues.consecutivo,
          available: false,
          id_contenedor: contenedorRecord.id,
          fecha_de_uso: fecha,
          id_motivo_de_uso: motivoDeUso.id,
          id_usuario: user && user.id ? user.id : null,
          ubicacion_en_contenedor: item.ubicacion_en_contenedor
        };

        const { updatedItem } = await this.actualizarSerial(payloadSerial, transaction);
        return updatedItem || item;
      }));

      const conteoProductos = serialesActualizados.reduce((acc, item) => {
        const producto = item.cons_producto || 'Sin producto';
        acc[producto] = (acc[producto] || 0) + 1;
        return acc;
      }, {});

      await Promise.all(Object.entries(conteoProductos).map(async ([cons_producto, cantidad]) => {
        const articulo = serialesActualizados.find((item) => item.cons_producto === cons_producto);
        if (!articulo) {
          return;
        }

        await stockService.subtractAmounts(articulo.cons_almacen, cons_producto, { cantidad }, transaction);
        await historialMovimientoService.create({
          cons_movimiento: movimiento.dataValues.consecutivo,
          cons_producto,
          cons_almacen_gestor: articulo.cons_almacen,
          cons_almacen_receptor: articulo.cons_almacen,
          cons_lista_movimientos: 'EX',
          tipo_movimiento: 'Salida',
          razon_movimiento: 'Inspeccion vacio',
          cantidad,
          cons_pedido: null
        }, transaction);
      }));

      const listado = await db.Listado.create({
        fecha,
        id_contenedor: contenedorRecord.id,
        transbordado: false,
        habilitado: true,
        id_embarque: embarque.id,
        id_producto: combo.id,
        id_lugar_de_llenado: almacen.id
      }, { transaction });

      const agenteInspeccion = String(
        agente || [user && user.nombre, user && user.apellido].filter(Boolean).join(' ').trim() || (user && user.username) || 'Sistema'
      ).trim();

      const inspeccion = await db.Inspeccion.create({
        id_contenedor: contenedorRecord.id,
        fecha_inspeccion: fecha,
        hora_inicio: hora_inicio || '00:00:00',
        hora_fin: hora_fin || '00:00:00',
        agente: agenteInspeccion,
        zona: zona || 'Inspeccion vacio',
        observaciones,
        habilitado: true
      }, { transaction });

      await transaction.commit();

      return { listado, inspeccion, movimiento: movimiento.dataValues.consecutivo, contenedor: contenedorRecord.contenedor };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async crearInspeccionVacio(payload, user) {
    const result = await this.createEmptyInspectionMassiveRow(payload, user);

    return {
      message: 'Inspeccion vacio guardada exitosamente.',
      data: result
    };
  }

  async cargarInspeccionVacioMasivo(rows, user) {
    const allowed = await this.canBulkUploadEmptyInspection(user);
    if (!allowed) {
      throw boom.unauthorized('Usted no esta autorizado para realizar el cargue masivo de inspeccion vacio');
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      throw boom.badRequest('No se recibieron filas para procesar.');
    }

    const moduloInsumos = await db.configuracion.findOne({ where: { modulo: 'Insumos_inspeccion_vacio' } });
    const insumosConfig = this.parseConfigDetails(moduloInsumos && moduloInsumos.detalles, []);

    if (!Array.isArray(insumosConfig) || insumosConfig.length === 0) {
      throw boom.badRequest('No hay insumos configurados para la inspeccion vacio.');
    }

    const results = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] || {};
      const fila = index + 1;
      const semana = this.getEmptyInspectionRowValue(row, ['semana', 'Semana']);
      const contenedor = this.getEmptyInspectionRowValue(row, ['contenedor', 'Contenedor']).toUpperCase();
      const observacionesFila = this.getEmptyInspectionRowValue(row, ['observaciones', 'Observaciones']);

      try {
        if (!semana) {
          throw boom.badRequest('Debes indicar la semana.');
        }

        const fecha = this.normalizeEmptyInspectionDate(this.getEmptyInspectionRowValue(row, ['fecha', 'Fecha']));

        if (!contenedor) {
          throw boom.badRequest('Debes indicar el contenedor.');
        }

        if (!/^[A-Z]{4}\d{7}$/.test(contenedor)) {
          throw boom.badRequest('El contenedor ' + contenedor + ' no cumple con el formato esperado.');
        }

        const seriales = insumosConfig.map((item) => {
          const nombre = String(item && item.name ? item.name : '').trim();
          const nombreCapitalizado = nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : '';
          const valor = this.getEmptyInspectionRowValue(row, [
            item && item.consecutivo,
            nombre,
            nombreCapitalizado,
            item && item.id != null ? String(item.id) : null
          ]);

          if (!valor) {
            throw boom.badRequest('Falta el serial del insumo ' + (nombre || item.consecutivo || item.id) + '.');
          }

          return valor;
        });

        const observaciones = [
          observacionesFila,
          'Registro generado por cargue masivo de inspeccion vacio.'
        ].filter(Boolean).join(' | ');

        const created = await this.createEmptyInspectionMassiveRow({
          semana,
          fecha,
          contenedor,
          seriales,
          observaciones
        }, user);

        results.push({
          fila,
          fecha,
          contenedor,
          error: false,
          message: 'Inspeccion vacio cargada correctamente.',
          cons_movimiento: created.movimiento
        });
      } catch (error) {
        results.push({
          fila,
          fecha: this.getEmptyInspectionRowValue(row, ['fecha', 'Fecha']),
          contenedor,
          error: true,
          message: error.message || 'No fue posible procesar la fila.'
        });
      }
    }

    const exitosas = results.filter((item) => !item.error).length;
    const fallidas = results.length - exitosas;

    return {
      message: 'Carga procesada. Exitosas: ' + exitosas + '. Fallidas: ' + fallidas + '.',
      results
    };
  }


  validateSerialUploadRows(rows = []) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw boom.badRequest('No se recibieron seriales para cargar.');
    }

    const almacenes = [...new Set(rows.map((item) => item?.cons_almacen).filter(Boolean))];
    if (almacenes.length !== 1) {
      throw boom.badRequest('Todos los seriales del archivo deben pertenecer al mismo almacen.');
    }

    const invalidRow = rows.findIndex((item) => !item?.cons_producto || !item?.serial);
    if (invalidRow !== -1) {
      throw boom.badRequest(`La fila ${invalidRow + 1} del archivo no tiene articulo o serial valido.`);
    }

    const repeatedSerials = rows.reduce((acc, item) => {
      acc[item.serial] = (acc[item.serial] || 0) + 1;
      return acc;
    }, {});

    const duplicates = Object.entries(repeatedSerials)
      .filter(([, count]) => count > 1)
      .map(([serial]) => serial);

    if (duplicates.length > 0) {
      throw boom.conflict(`El archivo contiene seriales repetidos: ${duplicates.join(', ')}`);
    }

    return almacenes[0];
  }

  async cargarSeriales({ data, remision, pedido, semana, fecha, observaciones, username }) {
    const consAlmacen = this.validateSerialUploadRows(data);

    const batchSize = 500; // TamaÃ±o del lote
    const t = await db.sequelize.transaction();

    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await db.serial_de_articulos.bulkCreate(batch, { transaction: t });
      }

      const countConsProductos = data.reduce((acc, item) => {
        acc[item.cons_producto] = (acc[item.cons_producto] || 0) + 1;
        return acc;
      }, {});
      const dataMovimiento = {
        prefijo: "RC", remision: remision, pendiente: false, observaciones: observaciones, cons_semana: semana,
        realizado_por: username, aprobado_por: username, vehiculo: null, fecha: fecha
      };
      const movimiento = await movimientoService.create(dataMovimiento, t);


      for (const key in countConsProductos) {
        if (countConsProductos.hasOwnProperty(key)) {
          const cons_producto = key;
          const cantidad = countConsProductos[key];
          await stockService.addAmounts(consAlmacen, cons_producto, { cantidad: cantidad }, t)
          const dataHistorial = {
            cons_movimiento: movimiento.dataValues.consecutivo,
            cons_producto: cons_producto,
            cons_almacen_gestor: consAlmacen,
            cons_almacen_receptor: consAlmacen,
            cons_lista_movimientos: "RC",
            tipo_movimiento: "Entrada",
            razon_movimiento: null,
            cantidad: cantidad,
            cons_pedido: pedido || null,
          }
          await historialMovimientoService.create(dataHistorial, t);
        };
      }

      await t.commit();
      return { bool: true, message: 'Datos cargados exitosamente', cons_movimiento: movimiento.dataValues.consecutivo, total_seriales: data.length };
    } catch (e) {
      await t.rollback();

      // Si es error de duplicados
      if (e.original && e.original.code === 'ER_DUP_ENTRY') {
        // Extraer el valor duplicado del mensaje de error
        const duplicatedValue = e.original.sqlMessage.match(/'([^']+)'/)[1];

        // Buscar todos los duplicados en los datos que intentamos insertar
        const allSerials = data.map(item => item.serial); // Asume que el campo se llama 'serial'
        const duplicateSerials = allSerials.filter(serial =>
          serial === duplicatedValue || // El que causÃ³ el error
          allSerials.indexOf(serial) !== allSerials.lastIndexOf(serial) // Otros duplicados en el lote
        );

        // Eliminar duplicados del array para mostrar lista Ãºnica
        const uniqueDuplicates = [...new Set(duplicateSerials)];


        throw new boom.conflict(`Seriales duplicados detectados: ${e.original.sqlMessage}`);
      }


      throw boom.badRequest(e.message || e.original?.sqlMessage || 'Error al cargar los datos.');
    }
  }


  async actualizarSeriales(data) {

    const batchSize = 100; // TamaÃ±o del lote, ajustable segÃºn tus necesidades
    const t = await db.sequelize.transaction();

    try {
      // Dividir los datos en lotes y procesar cada lote
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        // Obtener todos los seriales en el lote actual
        const seriales = batch.map(item => item.serial);
        const existingRecords = await db.serial_de_articulos.findAll({
          where: { serial: seriales },
          transaction: t
        });

        // Crear un mapa para bÃºsquedas rÃ¡pidas
        const existingMap = new Map(existingRecords.map(record => [record.serial, record]));

        // Dividir los datos en actualizaciones e inserciones
        const updates = [];
        const creations = [];

        for (const item of batch) {
          if (existingMap.has(item.serial)) {
            updates.push(db.serial_de_articulos.update(item, {
              where: { serial: item.serial },
              transaction: t
            }));
          } else {
            creations.push(db.serial_de_articulos.create({
              cons_producto: item.cons_producto,
              serial: item.serial,
              bag_pack: 'null',
              s_pack: 'null',
              m_pack: 'null',
              l_pack: 'null',
              cons_almacen: item.cons_almacen,
              cons_movimiento: item?.cons_movimiento,
              available: false
            }, { transaction: t }));
          }
        }

        // Ejecutar todas las actualizaciones e inserciones en paralelo
        await Promise.all([...updates, ...creations]);
      }

      await t.commit();
      return { message: "Datos cargados con Ã©xito" };
    } catch (error) {
      await t.rollback();
      throw new Error("Error al actualizar los datos: " + error.message);
    }
  }


  async encontrarUnserial(data) {
    const producto = data?.producto
    let include = []
    if (producto) include = [{
      model: db.productos,
      as: "producto",
      where: producto
    }]
    delete data.producto
    return await db.serial_de_articulos.findAll({
      where: data,
      include: include
    })
  }


  async listarSeriales(pagination, body = {}) {

    const {
      cons_producto, serial, bag_pack, s_pack, m_pack, l_pack,
      cons_almacen, available, id_contenedor, id_motivo_de_uso, cons_movimiento
    } = body;

    // 1. ConstrucciÃ³n dinÃ¡mica de filtros para mejorar el rendimiento de la DB
    const filters = {};

    if (cons_producto) filters.cons_producto = cons_producto;
    if (serial) filters.serial = { [Op.like]: `%${serial}%` };
    if (bag_pack) filters.bag_pack = { [Op.like]: `%${bag_pack}%` };
    if (s_pack) filters.s_pack = { [Op.like]: `%${s_pack}%` };
    if (m_pack) filters.m_pack = { [Op.like]: `%${m_pack}%` };
    if (l_pack) filters.l_pack = { [Op.like]: `%${l_pack}%` };
    if (id_contenedor) filters.id_contenedor = id_contenedor;
    if (id_motivo_de_uso) filters.id_motivo_de_uso = id_motivo_de_uso;
    if (cons_movimiento) filters.cons_movimiento = cons_movimiento;

    // Manejo de almacenes (Array o String)
    if (cons_almacen) {
      filters.cons_almacen = Array.isArray(cons_almacen)
        ? { [Op.in]: cons_almacen }
        : cons_almacen;
    }

    // Filtro booleano/estado
    if (available !== undefined) {
      filters.available = Array.isArray(available)
        ? { [Op.in]: available }
        : available;
    }

    const includeModels = [
      { model: db.productos, as: 'producto' },
      { model: db.usuarios, as: 'usuario' },
      { model: db.Contenedor, as: 'contenedor' },
      { model: db.MotivoDeUso },
    ];

    // 2. LÃ³gica de PaginaciÃ³n Centralizada
    if (pagination) {
      const limit = parseInt(pagination.limit) || 10;
      const page = parseInt(pagination.offset) || 1;
      const offset = (page - 1) * limit;


      // findAndCountAll ejecuta ambas consultas de forma Ã³ptima
      const { count, rows } = await db.serial_de_articulos.findAndCountAll({
        where: filters,
        include: includeModels,
        limit: limit,
        offset: offset,
        order: [['updatedAt', 'DESC']],
        distinct: true // Necesario cuando hay includes (JOINs) para contar correctamente
      });

      return { data: rows, total: count };
    }

    // Retorno sin paginaciÃ³n
    return await db.serial_de_articulos.findAll({
      where: filters,
      include: includeModels,
      order: [['updatedAt', 'DESC']]
    });
  }



  async listarArticulosSeguridad() {
    const productos = await db.productos.findAll({
      include: [{
        model: db.categorias,
        as: 'categoria',
        where: { nombre: "Seguridad" }
      }]
    })

    if (!productos) throw boom.notFound('No existen productos en esta categoria')
    return productos;
  }

  async paginarUsuarios(offset, limit, username) {
    if (!username) username = ""
    let newlimit = parseInt(limit);
    let newoffset = (parseInt(offset) - 1) * newlimit;
    const total = await db.usuarios.count({
      where: {
        username: { [Op.like]: `%${username}%` },
        id_rol: { [Op.in]: [ROLES.OPERADOR, 'Administrador', 'Seguridad', 'Super seguridad'] }
      },
    });
    const result = await db.usuarios.findAll({
      where: {
        username: { [Op.like]: `%${username}%` },
        id_rol: { [Op.in]: [ROLES.OPERADOR, 'Administrador', 'Seguridad', 'Super seguridad'] }
      },
      limit: newlimit,
      offset: newoffset
    });
    return { data: result, total: total };
  }

  async actualizarSerial(body, transaction = null) {
    let t;
    try {
      // Usa la transacciÃ³n proporcionada o crea una nueva si no se proporciona
      if (!transaction) {
        t = await db.sequelize.transaction();
      } else {
        t = transaction;
      }

      // ObtÃ©n el registro antes de la actualizaciÃ³n
      const item = await db.serial_de_articulos.findOne({
        where: {
          serial: body.serial
        },
        transaction: t
      });

      if (!item) {
        // Si no se encuentra el Ã­tem, realiza un rollback si se creÃ³ una transacciÃ³n
        if (!transaction) {
          await t.rollback();
        }
        return { affectedRows: 0, updatedItem: null };
      }

      // Realiza la actualizaciÃ³n
      const [affectedRows] = await db.serial_de_articulos.update(body, {
        where: {
          serial: body.serial
        },
        transaction: t
      });

      let updatedItem = null;
      if (affectedRows > 0) {
        // Refresca el Ã­tem para asegurarte de obtener los datos actualizados
        updatedItem = await item.reload({ transaction: t });
      }

      // Confirma la transacciÃ³n si se creÃ³ dentro de esta funciÃ³n
      if (!transaction) {
        await t.commit();
      }

      return { affectedRows, updatedItem };

    } catch (error) {
      // Realiza un rollback si se creÃ³ una transacciÃ³n
      if (t) {
        await t.rollback();
      }
      // Maneja el error
      throw boom.badRequest(error.message || 'Error al actualizar el serial');
    }
  }


  async inspeccionAntinarcoticos(body, user) {
    const { formulario, rechazos } = body;

    if (!formulario || !formulario.consecutivo || !formulario.fecha) {
      throw new Error("Datos insuficientes para realizar la inspección.");
    }

    const approvedBySuperAdmin = await this.canApproveFullInspection(user);
    const previousFullInspectionCount = await db.Inspeccion.count({
      where: {
        id_contenedor: formulario.consecutivo,
        zona: { [Op.ne]: 'Inspeccion vacio' }
      }
    });
    const requiresSuperAdminApproval = !approvedBySuperAdmin && previousFullInspectionCount >= 1;
    const inspectionApproved = approvedBySuperAdmin || !requiresSuperAdminApproval;
    const transaction = await db.sequelize.transaction();

    try {
      const inspeccion = await db.Inspeccion.create(
        {
          id_contenedor: formulario.consecutivo,
          fecha_inspeccion: formulario.fecha,
          hora_inicio: formulario.hora_inicio,
          hora_fin: formulario.hora_fin,
          agente: formulario.agente,
          habilitado: inspectionApproved,
          zona: formulario.zona,
          observaciones: formulario.observaciones || null
        },
        { transaction }
      );

      const [moviRechazo] = await db.MotivoDeRechazo.findOrCreate({
        where: { motivo_rechazo: "Inspección antinarcóticos" },
        defaults: {
          habilitado: true,
        },
        transaction,
      });

      if (rechazos?.length) {
        await Promise.all(
          rechazos.map((item) =>
            db.Rechazo.create(
              {
                id_motivo_de_rechazo: moviRechazo.id,
                id_producto: item.producto,
                cantidad: item.totalCajas,
                serial_palet: item.codigoPallet,
                cod_productor: item.cod_productor,
                id_contenedor: formulario.consecutivo,
                id_usuario: formulario?.id_usuario,
                habilitado: false,
                observaciones: formulario.observaciones,
                fecha_rechazo: formulario.fecha,
              },
              { transaction }
            )
          )
        );
      }

      const kitsInventario = await db.serial_de_articulos.findAll({
        where: { bag_pack: formulario.bolsa, available: true },
        transaction,
      });

      if (kitsInventario.length === 0) {
        throw new Error("No se encontraron artículos asociados al kit de inventario.");
      }

      const [moviUso] = await db.MotivoDeUso.findOrCreate({
        where: { consecutivo: "INSP02" },
        defaults: {
          consecutivo: "INSP02",
          motivo_de_uso: "Inspección antinarcóticos",
          habilitado: true,
        },
        transaction,
      });

      const movimiento = await movimientoService.create(
        {
          prefijo: "EX",
          pendiente: false,
          fecha: formulario.fecha,
          cons_semana: formulario.semana,
          realizado_por: user && user.username ? user.username : null,
          aprobado_por: inspectionApproved && user && user.username ? user.username : null,
        },
        transaction
      );

      await db.Inspeccion.update(
        {
          cons_movimiento: movimiento.consecutivo,
          observaciones: this.buildInspectionObservation(formulario.observaciones, movimiento.consecutivo)
        },
        {
          where: { id: inspeccion.id },
          transaction
        }
      );

      await Promise.all(
        kitsInventario.map(async (item) => {
          const article = item.dataValues;

          await db.serial_de_articulos.update(
            {
              available: false,
              fecha_de_uso: formulario.fecha,
              id_contenedor: formulario.consecutivo,
              cons_movimiento: movimiento.consecutivo,
              ubicacion_en_contenedor: "Exterior",
              id_usuario: formulario?.id_usuario,
              id_motivo_de_uso: moviUso.id,
            },
            {
              where: { id: article.id, available: true },
              transaction,
            }
          );

          await stockService.subtractAmounts(article.cons_almacen, article.cons_producto, { cantidad: 1 });

          await historialMovimientoService.create(
            {
              cons_movimiento: movimiento.consecutivo,
              cons_producto: article.cons_producto,
              cons_almacen_gestor: article.cons_almacen,
              cons_almacen_receptor: article.cons_almacen,
              cons_lista_movimientos: "EX",
              tipo_movimiento: "Salida",
              razon_movimiento: "Inspección antinarcóticos",
              cantidad: "1",
            },
            transaction
          );
        })
      );

      await transaction.commit();
      if (!inspectionApproved) {
        await this.notifyPendingFullInspectionApproval(formulario, user, previousFullInspectionCount);
      }

      return {
        message: inspectionApproved
          ? 'Inspección guardada y aprobada exitosamente.'
          : 'Inspección guardada y pendiente por aprobación del Super administrador.',
        approved: inspectionApproved,
        pending_approval: !inspectionApproved,
        data: inspeccion
      };
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error en inspección antinarcóticos:", error);
      throw error;
    }
  }

  async aprobarInspeccionLleno(body, user) {
    const { id_inspeccion } = body || {};

    if (!id_inspeccion) {
      throw boom.badRequest('Debes indicar la inspección a aprobar');
    }

    if (!(await this.canApproveFullInspection(user))) {
      throw boom.unauthorized('Solo el Super administrador puede aprobar la inspección lleno');
    }

    const inspeccion = await db.Inspeccion.findByPk(id_inspeccion);
    if (!inspeccion) {
      throw boom.notFound('La inspección indicada no existe');
    }

    if (inspeccion.habilitado === true) {
      return {
        message: 'La inspección ya estaba aprobada.',
        data: inspeccion
      };
    }

    let consMovimiento = this.getInspectionMovementReference(inspeccion);
    if (!consMovimiento) {
      const serialAsociado = await db.serial_de_articulos.findOne({
        where: {
          id_contenedor: inspeccion.id_contenedor,
          fecha_de_uso: inspeccion.fecha_inspeccion,
          available: false
        },
        include: [{ model: db.MotivoDeUso, where: { consecutivo: 'INSP02' }, required: true }],
        order: [['updatedAt', 'DESC']]
      });
      consMovimiento = serialAsociado?.cons_movimiento || null;
    }

    if (consMovimiento) {
      const movimiento = await db.movimientos.findOne({ where: { consecutivo: consMovimiento } });
      const respuestaMovimiento = String(movimiento?.respuesta || '').toLowerCase();
      if (respuestaMovimiento.includes('rechazada')) {
        throw boom.badRequest('La inspección ya fue rechazada y no puede aprobarse.');
      }

      await db.movimientos.update(
        {
          pendiente: false,
          respuesta: 'Aprobada inspección lleno',
          aprobado_por: user?.username || null
        },
        { where: { consecutivo: consMovimiento } }
      );
    }

    await db.Inspeccion.update(
      { habilitado: true },
      { where: { id: id_inspeccion } }
    );

    const updatedInspection = await db.Inspeccion.findByPk(id_inspeccion);
    return {
      message: 'La inspección fue aprobada exitosamente.',
      data: updatedInspection
    };
  }

  async rechazarInspeccionLleno(body, user) {
    const { id_inspeccion, observaciones = '' } = body || {};

    if (!id_inspeccion) {
      throw boom.badRequest('Debes indicar la inspección a rechazar');
    }

    if (!(await this.canApproveFullInspection(user))) {
      throw boom.unauthorized('Solo el Super administrador puede rechazar la inspección lleno');
    }

    const inspeccion = await db.Inspeccion.findByPk(id_inspeccion);
    if (!inspeccion) {
      throw boom.notFound('La inspección indicada no existe');
    }

    if (inspeccion.habilitado === true) {
      throw boom.badRequest('No puedes rechazar una inspección ya aprobada');
    }

    const [moviUso] = await db.MotivoDeUso.findOrCreate({
      where: { consecutivo: 'INSP02' },
      defaults: {
        consecutivo: 'INSP02',
        motivo_de_uso: 'Inspección antinarcóticos',
        habilitado: true,
      }
    });

    let consMovimiento = this.getInspectionMovementReference(inspeccion);
    let movimiento = consMovimiento
      ? await db.movimientos.findOne({ where: { consecutivo: consMovimiento } })
      : null;

    const serialWhere = {
      id_contenedor: inspeccion.id_contenedor,
      id_motivo_de_uso: moviUso.id,
      available: false
    };

    if (movimiento?.consecutivo) {
      serialWhere.cons_movimiento = movimiento.consecutivo;
    } else {
      serialWhere.fecha_de_uso = inspeccion.fecha_inspeccion;
    }

    const transaction = await db.sequelize.transaction();

    try {
      const seriales = await db.serial_de_articulos.findAll({
        where: serialWhere,
        transaction
      });

      if (!seriales.length) {
        throw boom.badRequest('No se encontraron seriales de inspección lleno para revertir');
      }

      if (!movimiento && seriales[0]?.cons_movimiento) {
        movimiento = await db.movimientos.findOne({
          where: { consecutivo: seriales[0].cons_movimiento },
          transaction
        });
        consMovimiento = movimiento?.consecutivo || seriales[0].cons_movimiento;
      }

      const respuestaActual = String(movimiento?.respuesta || '').toLowerCase();
      if (respuestaActual.includes('rechazada')) {
        await transaction.rollback();
        return {
          message: 'La inspección ya estaba rechazada.',
          data: inspeccion
        };
      }

      const reverseMovement = await movimientoService.create(
        {
          prefijo: 'AJ',
          pendiente: false,
          observaciones: observaciones || `Reversión inspección lleno ${consMovimiento || id_inspeccion}`,
          respuesta: 'Reversión por inspección lleno rechazada',
          cons_semana: movimiento?.cons_semana || null,
          realizado_por: user?.username || null,
          aprobado_por: user?.username || null,
          vehiculo: null,
          fecha: new Date().toISOString().slice(0, 10),
        },
        transaction
      );

      await Promise.all(seriales.map(async (item) => {
        await db.serial_de_articulos.update(
          {
            available: true,
            id_contenedor: null,
            fecha_de_uso: null,
            id_usuario: null,
            id_motivo_de_uso: null,
            cons_movimiento: null,
            ubicacion_en_contenedor: null,
            revisado: false,
          },
          {
            where: { id: item.id },
            transaction
          }
        );

        await stockService.addAmounts(item.cons_almacen, item.cons_producto, { cantidad: 1 }, transaction);

        await historialMovimientoService.create(
          {
            cons_movimiento: reverseMovement.consecutivo,
            cons_producto: item.cons_producto,
            cons_almacen_gestor: item.cons_almacen,
            cons_almacen_receptor: item.cons_almacen,
            cons_lista_movimientos: 'AJ',
            tipo_movimiento: 'Entrada',
            razon_movimiento: `Reversión inspección lleno no aprobada ${consMovimiento || ''}`.trim(),
            cantidad: 1,
            cons_pedido: null,
          },
          transaction
        );
      }));

      if (consMovimiento) {
        await db.movimientos.update(
          {
            pendiente: false,
            respuesta: `Rechazada: inspección lleno no aprobada${observaciones ? ` - ${observaciones}` : ''}`,
            aprobado_por: user?.username || null
          },
          { where: { consecutivo: consMovimiento }, transaction }
        );
      }

      const visibleObservation = this.extractVisibleObservation(inspeccion.observaciones);
      const mergedObservation = [visibleObservation, observaciones ? `Rechazo: ${observaciones}` : null]
        .filter(Boolean)
        .join('\n');

      await db.Inspeccion.update(
        {
          cons_movimiento: consMovimiento || reverseMovement.consecutivo,
          habilitado: false,
          observaciones: this.buildInspectionObservation(mergedObservation, consMovimiento || reverseMovement.consecutivo)
        },
        { where: { id: id_inspeccion }, transaction }
      );

      await transaction.commit();
      return {
        message: 'La inspección fue rechazada y los seriales regresaron al inventario.',
        data: {
          id_inspeccion,
          movimiento_rechazado: consMovimiento || null,
          movimiento_reversion: reverseMovement.consecutivo,
          seriales_revertidos: seriales.length
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async usarSeriales(body) {
    const { formulario, motivo_de_uso } = body;
    console.log(body);

    // Iniciar una transacciÃ³n
    const transaction = await db.sequelize.transaction();

    try {
      // ðŸ”¹ Buscar kit de inventario
      const kitsInventario = await db.serial_de_articulos.findAll({
        where: { bag_pack: formulario.bolsa, available: true },
        transaction,
      });

      if (kitsInventario.length === 0) {
        throw new Error("âŒ No se encontraron artÃ­culos asociados al kit de inventario.");
      }

      // ðŸ”¹ Contar cuÃ¡ntas veces aparece cada cons_producto
      const productosCantidad = {};
      kitsInventario.forEach(({ dataValues: article }) => {
        productosCantidad[article.cons_producto] = (productosCantidad[article.cons_producto] || 0) + 1;
      });

      // ðŸ”¹ Asegurar motivo de uso
      let cons_motivo_de_uso = motivo_de_uso?.consecutivo || "PRED01";

      if (cons_motivo_de_uso === "PRED01") {
        const [moviUso] = await db.MotivoDeUso.findOrCreate({
          where: { consecutivo: "PRED01" },
          defaults: {
            motivo_de_uso: "Predeterminado",
            habilitado: true,
          },
          transaction,
        });
        cons_motivo_de_uso = moviUso.id;
      } else {
        cons_motivo_de_uso = motivo_de_uso.id;
      }

      // ðŸ”¹ Crear movimiento de salida
      const movimiento = await movimientoService.create(
        {
          prefijo: "EX",
          pendiente: false,
          fecha: formulario.fecha,
          cons_semana: formulario.semana,
        },
        transaction
      );

      // ðŸ”¹ 1. PRIMERO: Actualizar cada artÃ­culo individualmente
      await Promise.all(
        kitsInventario.map(async ({ dataValues: article }) => {
          const updateResult = await db.serial_de_articulos.update(
            {
              available: false,
              fecha_de_uso: formulario.fecha,
              id_contenedor: formulario.contenedorId,
              ubicacion_en_contenedor: "Exterior",
              id_usuario: formulario.id_usuario,
              id_motivo_de_uso: cons_motivo_de_uso,
            },
            {
              where: { id: article.id, available: true },
              transaction,
            }
          );

          if (updateResult[0] === 0) {
            throw new Error(`âŒ No se pudo actualizar el artÃ­culo con ID: ${article.id}`);
          }
        })
      );

      // ðŸ”¹ 2. SEGUNDO: Restar del stock (SOLO UNA VEZ POR PRODUCTO)
      // Obtener productos Ãºnicos
      const productosUnicos = [...new Set(kitsInventario.map(item => item.dataValues.cons_producto))];

      await Promise.all(
        productosUnicos.map(async (cons_producto) => {
          // Encontrar el primer artÃ­culo de este producto para obtener su almacÃ©n
          const primerArticulo = kitsInventario.find(
            item => item.dataValues.cons_producto === cons_producto
          );

          if (!primerArticulo) return;
          console.log(
            primerArticulo.dataValues.cons_almacen,  // primer parÃ¡metro: cons_almacen
            cons_producto,                          // segundo parÃ¡metro: cons_producto
            { cantidad: productosCantidad[cons_producto] }, "heywin")
          // Llamar a subtractAmounts con los parÃ¡metros correctos
          await stockService.subtractAmounts(
            primerArticulo.dataValues.cons_almacen,  // primer parÃ¡metro: cons_almacen
            cons_producto,                          // segundo parÃ¡metro: cons_producto
            { cantidad: productosCantidad[cons_producto] }  // tercer parÃ¡metro: body con cantidad
          );

          console.log(`âœ… Restado stock: ${cons_producto}, cantidad: ${productosCantidad[cons_producto]}, almacÃ©n: ${primerArticulo.dataValues.cons_almacen}`);
        })
      );

      // ðŸ”¹ 3. Registrar movimientos en historial
      await Promise.all(
        Object.entries(productosCantidad).map(async ([cons_producto, cantidad]) => {
          const primerArticulo = kitsInventario.find(
            item => item.dataValues.cons_producto === cons_producto
          );

          await historialMovimientoService.create(
            {
              cons_movimiento: movimiento.consecutivo,
              cons_producto,
              cons_almacen_gestor: primerArticulo.dataValues.cons_almacen,
              cons_almacen_receptor: primerArticulo.dataValues.cons_almacen,
              cons_lista_movimientos: "EX",
              tipo_movimiento: "Salida",
              razon_movimiento: "InspecciÃ³n antinarcÃ³ticos",
              cantidad: cantidad.toString(),
            },
            transaction
          );
        })
      );

      // ðŸ”¹ Confirmar transacciÃ³n
      await transaction.commit();
      console.log("âœ… InspecciÃ³n antinarcÃ³ticos completada con Ã©xito.");
      return true;

    } catch (error) {
      // ðŸ”¹ Revertir transacciÃ³n en caso de error
      if (transaction) await transaction.rollback();
      console.error("ðŸš¨ Error en inspecciÃ³n antinarcÃ³ticos:", error.message);
      throw error;
    }
  }

  async corregirInspeccionContenedor(body, user) {
    const {
      id_inspeccion,
      contenedor_correcto,
      observaciones = '',
    } = body || {};

    if (!id_inspeccion) {
      throw boom.badRequest('Debes indicar la inspeccion a corregir');
    }

    const contenedorCorrectoNormalizado = String(contenedor_correcto || '').trim().toUpperCase();
    if (!contenedorCorrectoNormalizado) {
      throw boom.badRequest('Debes indicar el contenedor correcto');
    }

    const allowed = await this.canCorrectInspectedContainer(user);
    if (!allowed) {
      throw boom.unauthorized('Usted no esta autorizado para corregir contenedores inspeccionados');
    }

    const transaction = await db.sequelize.transaction();

    try {
      const inspeccion = await db.Inspeccion.findByPk(id_inspeccion, { transaction });
      if (!inspeccion) {
        throw boom.notFound('La inspeccion no existe');
      }

      if (!inspeccion.id_contenedor) {
        throw boom.badRequest('La inspeccion no tiene un contenedor asociado');
      }

      const contenedorActual = await db.Contenedor.findByPk(inspeccion.id_contenedor, { transaction });
      if (!contenedorActual) {
        throw boom.notFound('El contenedor actual de la inspeccion no existe');
      }

      const contenedorNuevo = await db.Contenedor.findOne({
        where: { contenedor: contenedorCorrectoNormalizado },
        order: [['id', 'DESC']],
        transaction,
      });

      if (!contenedorNuevo) {
        throw boom.notFound('El contenedor correcto no existe');
      }

      if (contenedorNuevo.id === contenedorActual.id) {
        throw boom.badRequest('La inspeccion ya esta asociada a ese contenedor');
      }

      const fechaInspeccion = new Date(inspeccion.fecha_inspeccion);
      if (Number.isNaN(fechaInspeccion.getTime())) {
        throw boom.badRequest('La inspeccion no tiene una fecha valida para realizar la correccion');
      }

      const inicioDia = new Date(fechaInspeccion);
      inicioDia.setUTCHours(0, 0, 0, 0);
      const finDia = new Date(fechaInspeccion);
      finDia.setUTCHours(23, 59, 59, 999);

      const motivoUsoInspeccion = await db.MotivoDeUso.findOne({
        where: { consecutivo: 'INSP02' },
        transaction,
      });

      const motivoRechazoInspeccion = await db.MotivoDeRechazo.findOne({
        where: { motivo_rechazo: 'Inspecci?n antinarc?ticos' },
        transaction,
      });

      const serialWhere = {
        id_contenedor: contenedorActual.id,
        fecha_de_uso: { [Op.between]: [inicioDia.toISOString(), finDia.toISOString()] },
      };

      if (motivoUsoInspeccion) {
        serialWhere.id_motivo_de_uso = motivoUsoInspeccion.id;
      }

      const rechazoWhere = {
        id_contenedor: contenedorActual.id,
        fecha_rechazo: { [Op.between]: [inicioDia.toISOString(), finDia.toISOString()] },
      };

      if (motivoRechazoInspeccion) {
        rechazoWhere.id_motivo_de_rechazo = motivoRechazoInspeccion.id;
      }

      await db.Inspeccion.update(
        { id_contenedor: contenedorNuevo.id },
        { where: { id: inspeccion.id }, transaction }
      );

      const [rechazosActualizados] = await db.Rechazo.update(
        { id_contenedor: contenedorNuevo.id },
        { where: rechazoWhere, transaction }
      );

      const [serialesActualizados] = await db.serial_de_articulos.update(
        { id_contenedor: contenedorNuevo.id },
        { where: serialWhere, transaction }
      );

      await transaction.commit();

      return {
        message: 'El contenedor inspeccionado fue corregido exitosamente',
        data: {
          id_inspeccion: inspeccion.id,
          contenedor_anterior: contenedorActual.contenedor,
          contenedor_nuevo: contenedorNuevo.contenedor,
          seriales_actualizados: serialesActualizados,
          rechazos_actualizados: rechazosActualizados,
          observaciones: observaciones,
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

    async corregirAsignacionSerial(body, user) {
    const {
      serial_errado,
      serial_correcto,
      observaciones = '',
    } = body || {};

    if (!serial_errado) {
      throw boom.badRequest('Debes indicar el serial a corregir');
    }

    const allowed = await this.canCorrectSerials(user);
    if (!allowed) {
      throw boom.unauthorized('Usted no esta autorizado para corregir seriales');
    }

    const transaction = await db.sequelize.transaction();

    try {
      const wrongSerial = await db.serial_de_articulos.findOne({
        where: { serial: serial_errado },
        include: [
          { model: db.productos, as: 'producto' },
          { model: db.Contenedor, as: 'contenedor' },
          { model: db.MotivoDeUso },
        ],
        transaction,
      });

      const wrongSerialIsAvailable = wrongSerial?.available === true
        || wrongSerial?.available === 1
        || wrongSerial?.available === '1';

      if (!wrongSerial) {
        throw boom.notFound('El serial a corregir no existe');
      }

      if (wrongSerialIsAvailable || !wrongSerial.id_contenedor) {
        throw boom.badRequest('El serial indicado no esta asignado a un contenedor');
      }

      let replacementSerial = null;
      if (serial_correcto) {
        const normalizedReplacementSerial = String(serial_correcto).trim().toUpperCase();
        replacementSerial = await db.serial_de_articulos.findOne({
          where: { serial: normalizedReplacementSerial },
          include: [
            { model: db.productos, as: 'producto' },
            { model: db.MotivoDeUso },
          ],
          transaction,
        });

        const replacementSerialIsAvailable = replacementSerial?.available === true
          || replacementSerial?.available === 1
          || replacementSerial?.available === '1';

        if (!replacementSerial) {
          throw boom.notFound('El serial correcto no existe');
        }

        if (!replacementSerialIsAvailable) {
          throw boom.badRequest('El serial correcto no esta disponible');
        }

        if (replacementSerial.cons_producto !== wrongSerial.cons_producto) {
          throw boom.badRequest('El serial correcto debe ser del mismo articulo que el serial errado');
        }
      }

      const movement = await movimientoService.create({
        prefijo: 'AJ',
        pendiente: false,
        observaciones: `Correccion de serial ${serial_errado}${serial_correcto ? ` por ${serial_correcto}` : ''}. ${observaciones}`.trim(),
        cons_semana: null,
        realizado_por: user?.username || null,
        aprobado_por: user?.username || null,
        vehiculo: null,
        fecha: new Date().toISOString().slice(0, 10),
      }, transaction);

      await db.serial_de_articulos.update(
        {
          available: true,
          id_contenedor: null,
          fecha_de_uso: null,
          id_usuario: null,
          id_motivo_de_uso: null,
          cons_movimiento: null,
          ubicacion_en_contenedor: null,
        },
        {
          where: { id: wrongSerial.id },
          transaction,
        }
      );

      await stockService.addAmounts(
        wrongSerial.cons_almacen,
        wrongSerial.cons_producto,
        { cantidad: 1 },
        transaction
      );

      await historialMovimientoService.create(
        {
          cons_movimiento: movement.consecutivo,
          cons_producto: wrongSerial.cons_producto,
          cons_almacen_gestor: wrongSerial.cons_almacen,
          cons_almacen_receptor: wrongSerial.cons_almacen,
          cons_lista_movimientos: 'AJ',
          tipo_movimiento: 'Entrada',
          razon_movimiento: `Reversion serial errado ${serial_errado}`,
          cantidad: 1,
          cons_pedido: null,
        },
        transaction
      );

      if (replacementSerial) {
        await db.serial_de_articulos.update(
          {
            available: false,
            id_contenedor: wrongSerial.id_contenedor,
            fecha_de_uso: wrongSerial.fecha_de_uso,
            id_usuario: user?.id || wrongSerial.id_usuario,
            id_motivo_de_uso: wrongSerial.id_motivo_de_uso,
            cons_movimiento: wrongSerial.cons_movimiento,
            ubicacion_en_contenedor: wrongSerial.ubicacion_en_contenedor,
          },
          {
            where: { id: replacementSerial.id, available: true },
            transaction,
          }
        );

        await stockService.subtractAmounts(
          replacementSerial.cons_almacen,
          replacementSerial.cons_producto,
          { cantidad: 1 },
          transaction
        );

        await historialMovimientoService.create(
          {
            cons_movimiento: movement.consecutivo,
            cons_producto: replacementSerial.cons_producto,
            cons_almacen_gestor: replacementSerial.cons_almacen,
            cons_almacen_receptor: replacementSerial.cons_almacen,
            cons_lista_movimientos: 'AJ',
            tipo_movimiento: 'Salida',
            razon_movimiento: `Reasignacion serial correcto ${replacementSerial.serial} al contenedor ${wrongSerial.id_contenedor}`,
            cantidad: 1,
            cons_pedido: null,
          },
          transaction
        );
      }

      await transaction.commit();

      return {
        message: replacementSerial
          ? 'El serial fue corregido y reemplazado exitosamente'
          : 'La asignacion del serial fue revertida exitosamente',
        data: {
          serial_errado,
          serial_correcto: replacementSerial?.serial || serial_correcto || null,
          id_contenedor: wrongSerial.id_contenedor,
          cons_movimiento: movement.consecutivo,
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }




}

module.exports = SeguridadService;

