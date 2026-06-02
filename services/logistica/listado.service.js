const boom = require('@hapi/boom');
const { Op, where } = require('sequelize');
const db = require('../../models');

const SeguridadService = require('../seguridad/seguridad.service');
const MovimientoService = require('../movimientos.service');

const HistorialMovimientoService = require('../historialMovimientos.service');
const StockService = require('../stock.service');
const stockService = new StockService();
const seguridadService = new SeguridadService();
const movimientoService = new MovimientoService();

const historialMovimientoService = new HistorialMovimientoService()

class ListadoService {

  async create(data) {
    const transaction = await db.sequelize.transaction(); // Inicia una nueva transacción
    // Datos predeterminados para la creación de registros
    const defaults = {
      destino: { pais: "Predeterminado", cod: "PRE", habilitado: true },
      naviera: { cod: "PRE", habilitado: true },
      buque: { habilitado: true },
      cliente: {
        razon_social: "Predeterminado",
        nit: 999999999,
        domicilio: "Calle predeterminada",
        telefono: 3000000000,
        email: "predeterminado@default.ex",
        activo: true,
        pais: "Predeterminado"
      },
      semana: { semana: 0, anho: 2000 },
      embarque: {
        viaje: "N/A", anuncio: "N/A", sae: "N/A", booking: "N/A", bl: "N/A",
        fecha_zarpe: "2024-01-01 00:00:00", fecha_arribo: "2024-01-01 00:00:00",
        observaciones: "", habilitado: true
      },
      producto: { nombre: "Predeterminado", isBlock: false },
      almacen: { nombre: "Predeterminado", isBlock: false }
    };

    try {
      // Crear registros predeterminados si no existen
      const [destino] = await db.Destino.findOrCreate({ where: { destino: "Predeterminado" }, defaults: defaults.destino });
      const [naviera] = await db.Naviera.findOrCreate({ where: { navieras: "Predeterminado" }, defaults: defaults.naviera });
      const [buque] = await db.Buque.findOrCreate({ where: { buque: "Predeterminado", id_naviera: naviera.id }, defaults: { ...defaults.buque } });
      const [cliente] = await db.clientes.findOrCreate({ where: { cod: "PRE" }, defaults: defaults.cliente });
      const [semana] = await db.semanas.findOrCreate({ where: { consecutivo: "S00-2000" }, defaults: defaults.semana });
      const [combo] = await db.combos.findOrCreate({ where: { consecutivo: "PRE" }, defaults: defaults.producto });


      const [almacen] = await db.almacenes.findOrCreate({ where: { consecutivo: "PRE" }, defaults: defaults.almacen });

      const [embarque] = await db.Embarque.findOrCreate({
        where: { booking: "N/A" },
        defaults: { ...defaults.embarque, id_semana: semana.id, id_cliente: cliente.id, id_destino: destino.id, id_naviera: naviera.id, id_buque: buque.id }
      });


      // Crear contenedor
      const contenedor = await db.Contenedor.create({ contenedor: data.contenedor, habilitado: true }, { transaction });

      // Preparar datos de movimiento
      const dataMovimiento = {
        prefijo: "EX",
        pendiente: false,
        observaciones: data.observaciones,
        cons_semana: data.semana,
        realizado_por: data.usuario.username,
        vehiculo: data.vehiculo || "N/A",
        fecha: data.fecha
      };

      // Asegurar existencia del motivo de uso
      const [moviUso] = await db.MotivoDeUso.findOrCreate({
        where: { consecutivo: "INSP01" },
        defaults: { consecutivo: "INSP01", motivo_de_uso: "Inspección vacío", habilitado: true },
        transaction
      });

      // Crear movimiento
      const movimiento = await movimientoService.create(dataMovimiento, transaction);
      const seriales = await db.serial_de_articulos.findAll({ where: { bag_pack: data.seriales, available: true } });
      // Actualizar seriales
      const serialesActualizados = await Promise.all(seriales.map(async (item) => {

        const itemSerial = {
          serial: item.serial,
          cons_movimiento: movimiento.dataValues.consecutivo,
          available: false,
          id_contenedor: contenedor.id,
          fecha_de_uso: data.fecha,
          id_motivo_de_uso: moviUso.id,
          id_usuario: data.usuario.id,
          ubicacion_en_contenedor: item.ubicacion_en_contenedor
        };
        const { updatedItem } = await seguridadService.actualizarSerial(itemSerial, transaction);
        return updatedItem;
      }));

      // Contar productos
      const conteoProductos = serialesActualizados.reduce((acc, item) => {
        const producto = item.cons_producto || 'Sin producto';
        acc[producto] = (acc[producto] || 0) + 1;
        return acc;
      }, {});

      // Procesar conteo de productos y actualizar stock
      await Promise.all(Object.entries(conteoProductos).map(async ([producto, cantidad]) => {
        const cons_almacen = serialesActualizados[0].cons_almacen;
        await stockService.subtractAmounts(cons_almacen, producto, { cantidad }, transaction);
        const dataHistorial = {
          cons_movimiento: movimiento.dataValues.consecutivo,
          cons_producto: producto,
          cons_almacen_gestor: cons_almacen,
          cons_almacen_receptor: cons_almacen,
          cons_lista_movimientos: "EX",
          tipo_movimiento: "Salida",
          razon_movimiento: "Inspección vacío",
          cantidad,
          cons_pedido: null
        };
        await historialMovimientoService.create(dataHistorial, transaction);
      }));

      // Crear listado
      const listado = {
        fecha: data.fecha,
        id_contenedor: contenedor.id,
        transbordado: false,
        habilitado: true,
        id_embarque: embarque.id,
        id_producto: combo.id,
        id_lugar_de_llenado: almacen.id
      };

      console.log(listado)

      const itemListado = await db.Listado.create(listado, { transaction });

      // Confirmar la transacción
      await transaction.commit();
      return itemListado;

    } catch (error) {
      // Revertir transacción en caso de error
      await transaction.rollback();
      throw boom.badRequest(error.message || "Error al crear el listado");
    }
  }


  //Cargue Masivo
  async bulkCreate(dataArray) {
    const transaction = await db.sequelize.transaction();
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw boom.badRequest("El formato de los datos es incorrecto o está vacío.");
      }

      // Validar que ningún campo en los objetos de dataArray sea null o undefined
      for (const item of dataArray) {
        if (Object.values(item).some(value => value === null || value === undefined)) {
          throw boom.badRequest("Todos los campos deben contener valores válidos, no se permiten valores nulos.");
        }
      }

      // Mapa para evitar duplicados en la misma carga
      const uniqueData = new Map();
      for (const item of dataArray) {
        const key = `${item.contenedor}_${item.bl}`;
        if (!uniqueData.has(key)) {
          uniqueData.set(key, item);
        }
      }

      // Obtener todos los embarques válidos
      const blList = [...new Set(dataArray.map(item => String(item.bl)))]; // Convertir a string
      const embarques = await db.Embarque.findAll({ where: { bl: blList } });
      const embarqueMap = new Map(embarques.map(e => [String(e.bl), e.id])); // Convertir claves a string

      // Validar existencia de embarques
      for (const item of dataArray) {
        if (!embarqueMap.has(String(item.bl))) {
          throw boom.notFound(`No se encontró un embarque con BL: ${item.bl}`);
        }
      }

      // Obtener relaciones de contenedores con embarques
      const contenedorIds = [...new Set(dataArray.map(item => item.contenedor))];
      const listadoExistente = await db.Listado.findAll({
        where: { id_embarque: Array.from(embarqueMap.values()) },
        include: {
          model: db.Contenedor,
          where: { contenedor: contenedorIds },
          attributes: ["id", "contenedor"]
        },
        attributes: ["id_contenedor", "id_embarque"]
      });

      // Mapa { `contenedor_idEmbarque`: id_contenedor }
      const listadoMap = new Map(
        listadoExistente.map(l => [`${l.Contenedor.contenedor}_${l.id_embarque}`, l.id_contenedor])
      );

      // Procesar contenedores reutilizando los existentes
      const contenedorMap = new Map();
      const datosValidos = await Promise.all(
        dataArray.map(async (item) => {
          const id_embarque = embarqueMap.get(String(item.bl)); // Convertir bl a string antes de buscar
          const key = `${item.contenedor}_${id_embarque}`;

          if (contenedorMap.has(key)) {
            return { ...item, id_contenedor: contenedorMap.get(key), id_embarque };
          }

          if (listadoMap.has(key)) {
            contenedorMap.set(key, listadoMap.get(key));
            return { ...item, id_contenedor: listadoMap.get(key), id_embarque };
          }

          let contenedor = await db.Contenedor.findOne({ where: { contenedor: item.contenedor } });
          if (!contenedor) {
            contenedor = await db.Contenedor.create(
              { contenedor: item.contenedor, habilitado: true },
              { transaction }
            );
          }

          contenedorMap.set(key, contenedor.id);
          return { ...item, id_contenedor: contenedor.id, id_embarque };
        })
      );

      // Limpiar datos antes de insertar
      datosValidos.forEach(item => {
        delete item.contenedor;
        delete item.bl;
      });

      // Insertar datos en Listado
      // Asegúrate de agregar habilitado: true en todos los objetos
      const datosConHabilitado = datosValidos.map(item => ({
        ...item,
        habilitado: item.habilitado !== undefined ? item.habilitado : true
      }));

      // Luego, realizar el bulkCreate
      const results = await db.Listado.bulkCreate(datosConHabilitado, { validate: true, transaction });
      await transaction.commit();

      return { message: "Carga masiva exitosa", count: results.length };
    } catch (error) {
      await transaction.rollback();
      console.error("Error en bulkCreate:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        const codExistente = error.errors?.[0]?.value || "desconocido";
        throw boom.conflict(`El código '${codExistente}' ya existe. Debe ser único.`);
      }

      if (error.name === "SequelizeValidationError") {
        const detalles = error.errors.map(err => err.message);
        throw boom.badRequest("Error de validación en los datos.", { detalles });
      }

      throw boom.internal("Error interno del servidor al crear el item.");
    }
  }



  async duplicarListado(id, transaction) {
    // Encontrar el listado por ID
    const listado = await db.Listado.findByPk(id);

    // Verificar si el listado existe
    if (!listado) {
      throw boom.notFound('El listado no existe');
    }

    // Clonar el listado sin el ID
    const listadoData = { ...listado.toJSON() };
    delete listadoData.id;  // Eliminar la propiedad 'id'

    try {
      // Crear un nuevo listado en la base de datos usando la transacción
      const itemListado = await db.Listado.create(listadoData, { transaction });
      return itemListado;
    } catch (error) {
      // Manejar el error adecuadamente
      throw boom.badImplementation('Error al duplicar el listado');
    }
  }


  async find() {
    return db.Listado.findAll();
  }

  async findOne(id) {
    const listado = await db.Listado.findByPk(id);
    if (!listado) {
      throw boom.notFound('El listado no existe');
    }
    return listado;
  }

  async update(id, changes) {
    const listado = await db.Listado.findByPk(id);
    if (!listado) {
      throw boom.notFound('El listado no existe');
    }

    const { id_transportadora, ...listadoChanges } = changes || {};

    if (Object.keys(listadoChanges).length > 0) {
      await db.Listado.update(listadoChanges, { where: { id } });
    }

    if (Object.prototype.hasOwnProperty.call(changes || {}, 'id_transportadora')) {
      const contenedorId = listado.id_contenedor;
      const normalizedTransportadoraId = (
        id_transportadora === undefined
        || id_transportadora === null
        || id_transportadora === ''
      ) ? null : Number(id_transportadora);

      if (normalizedTransportadoraId === null || Number.isNaN(normalizedTransportadoraId)) {
        await db.carrusel.destroy({ where: { id_contenedor: contenedorId } });
      } else {
        const [carruselRow] = await db.carrusel.findOrCreate({
          where: { id_contenedor: contenedorId },
          defaults: {
            id_contenedor: contenedorId,
            id_transportadora: normalizedTransportadoraId
          }
        });

        if (carruselRow.id_transportadora !== normalizedTransportadoraId) {
          await carruselRow.update({ id_transportadora: normalizedTransportadoraId });
        }
      }
    }

    return { message: 'El listado fue actualizado', id, changes };
  }

  //Actualizacion masiva
async bulkUpdate(payload) {
  const transaction = await db.sequelize.transaction();

  try {
    const updatesArray = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.rows)
        ? payload.rows
        : [];
    const allowPartial = Boolean(payload?.allowPartial);

    const results = [];
    const missingRows = [];
    const usedListadoIds = new Map();

    for (const updateData of updatesArray) {
      const { fecha, contenedor, bl, booking, id_transportadora, ...changes } = updateData;

      if (!fecha || !contenedor) {
        missingRows.push({
          ...updateData,
          reason: 'Fecha y contenedor son requeridos para la actualizacion',
        });
        continue;
      }

      const fechaInicio = new Date(fecha);
      const fechaFin = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(23, 59, 59, 999);

      const reference = String(bl || booking || '').trim();
      let embarqueId = null;
      if (reference) {
        const embarque = await db.Embarque.findOne({
          where: {
            [Op.or]: [
              { bl: reference },
              { booking: reference },
            ],
          },
          transaction,
        });

        if (!embarque) {
          missingRows.push({
            ...updateData,
            reason: `Embarque con referencia ${reference} no encontrado`,
          });
          continue;
        }

        embarqueId = embarque.id;
        changes.id_embarque = embarqueId;
      }

      const listadosCandidatos = await db.Listado.findAll({
        where: {
          fecha: {
            [Op.between]: [fechaInicio, fechaFin]
          }
        },
        include: [
          {
            model: db.Contenedor,
            where: { contenedor },
            required: true
          },
          {
            model: db.Embarque,
            required: false
          }
        ],
        order: [['id', 'ASC']],
        transaction
      });

      if (!listadosCandidatos.length) {
        missingRows.push({
          ...updateData,
          reason: `Listado no encontrado para fecha ${fecha} y contenedor ${contenedor}`,
        });
        continue;
      }

      const candidatePool = embarqueId
        ? (listadosCandidatos.filter((item) => Number(item?.id_embarque) === Number(embarqueId)).length
          ? listadosCandidatos.filter((item) => Number(item?.id_embarque) === Number(embarqueId))
          : listadosCandidatos)
        : listadosCandidatos;

      const usageKey = `${fecha}__${contenedor}__${embarqueId || reference || 'sin-embarque'}`;
      if (!usedListadoIds.has(usageKey)) {
        usedListadoIds.set(usageKey, new Set());
      }
      const usedIds = usedListadoIds.get(usageKey);

      const expectedAlmacenId = changes.id_lugar_de_llenado != null && changes.id_lugar_de_llenado !== ''
        ? Number(changes.id_lugar_de_llenado)
        : null;
      const expectedProductoId = changes.id_producto != null && changes.id_producto !== ''
        ? Number(changes.id_producto)
        : null;

      let listado = candidatePool.find((item) => (
        !usedIds.has(item.id)
        && (expectedAlmacenId == null || Number(item?.id_lugar_de_llenado) === expectedAlmacenId)
        && (expectedProductoId == null || Number(item?.id_producto) === expectedProductoId)
      )) || null;

      if (!listado) {
        listado = candidatePool.find((item) => !usedIds.has(item.id)) || null;
      }

      let duplicated = false;
      if (!listado) {
        const baseListado = candidatePool[candidatePool.length - 1] || null;
        if (!baseListado) {
          missingRows.push({
            ...updateData,
            reason: `No se encontro una linea base para duplicar en fecha ${fecha}, contenedor ${contenedor}`,
          });
          continue;
        }

        listado = await db.Listado.create({
          fecha: baseListado.fecha,
          id_embarque: embarqueId || baseListado.id_embarque,
          id_contenedor: baseListado.id_contenedor,
          id_lugar_de_llenado: baseListado.id_lugar_de_llenado,
          id_producto: baseListado.id_producto,
          cajas_unidades: baseListado.cajas_unidades,
          id_sae: baseListado.id_sae,
          transbordado: baseListado.transbordado,
          habilitado: baseListado.habilitado,
        }, { transaction });
        duplicated = true;
      }

      await db.Listado.update(changes, {
        where: {
          id: listado.id
        },
        transaction
      });

      usedIds.add(listado.id);

      if (id_transportadora !== undefined && id_transportadora !== null && id_transportadora !== '') {
        const transporteId = Number(id_transportadora);
        if (!isNaN(transporteId)) {
          const [carruselRow] = await db.carrusel.findOrCreate({
            where: { id_contenedor: listado.id_contenedor },
            defaults: { id_transportadora: transporteId, id_contenedor: listado.id_contenedor },
            transaction
          });
          if (carruselRow.id_transportadora !== transporteId) {
            await carruselRow.update({ id_transportadora: transporteId }, { transaction });
          }
        }
      }

      results.push({
        message: duplicated ? 'Registro duplicado y actualizado' : 'Registro actualizado',
        duplicated,
        id: listado.id,
        fecha,
        contenedor,
        bl: reference,
        embarqueId,
        id_transportadora,
        changes
      });
    }

    if (missingRows.length > 0 && !allowPartial) {
      await transaction.rollback();
      return {
        message: 'Se encontraron registros sin coincidencia para actualizar.',
        requiresConfirmation: true,
        partial: true,
        total: updatesArray.length,
        processableCount: results.length,
        missingCount: missingRows.length,
        missingRows,
      };
    }

    await transaction.commit();
    return {
      message: missingRows.length > 0
        ? 'Actualizacion masiva completada parcialmente'
        : 'Actualizacion masiva completada',
      partial: missingRows.length > 0,
      total: results.length,
      requestedTotal: updatesArray.length,
      missingCount: missingRows.length,
      missingRows,
      results
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
  async delete(id) {
    const listado = await db.Listado.findByPk(id);
    if (!listado) {
      throw boom.notFound('El listado no existe');
    }
    await db.Listado.destroy({ where: { id } });
    return { message: 'El listado fue eliminado', id };
  }

  buildPaginateQuery(body = {}) {
    let fechaInicial = body.fecha_inicial ? new Date(body.fecha_inicial) : null;
    let fechaFinal = body.fecha_final ? new Date(body.fecha_final) : null;
    let bodyFilter = {};

    if (fechaInicial && fechaFinal) {
      fechaInicial.setHours(0, 0, 0, 0);
      fechaFinal.setHours(23, 59, 59, 999);
      bodyFilter.fecha = {
        [Op.between]: [fechaInicial, fechaFinal]
      };
    } else if (fechaInicial) {
      fechaInicial.setDate(fechaInicial.getDate());
      fechaInicial.setHours(0, 0, 0, 0);
      bodyFilter.fecha = {
        [Op.between]: [
          fechaInicial,
          new Date(`${fechaInicial.getFullYear()}-12-31T23:59:59.999`)
        ]
      };
    } else if (fechaFinal) {
      fechaFinal.setHours(23, 59, 59, 999);
      bodyFilter.fecha = {
        [Op.lte]: fechaFinal
      };
    }

    if (body?.habilitado !== undefined) {
      bodyFilter.habilitado = body.habilitado;
    }

    const createFilter = (field, value) =>
      value ? { [field]: { [Op.like]: `%${value}%` } } : undefined;
    const shouldIncludeSeriales = body?.includeSeriales !== false;

    const includeOptions = [
      {
        model: db.Contenedor,
        where: createFilter("contenedor", body.contenedor),
        required: !!body.contenedor,
        include: [{
          model: db.carrusel,
          required: false,
          include: [{
            model: db.transportadoras,
            as: 'transportadora',
            required: false
          }]
        }]
      },
      {
        model: db.Embarque,
        required: !!(body.booking || body.bl || body.destino || body.naviera || body.cliente || body.buque || body.semana),
        where: {
          ...(createFilter("booking", body.booking) || {}),
          ...(createFilter("bl", body.bl) || {})
        },
        include: [
          { model: db.Destino, where: createFilter("destino", body.destino), required: !!body.destino },
          { model: db.Naviera, where: createFilter("navieras", body.naviera), required: !!body.naviera },
          { model: db.clientes, where: createFilter("cod", body.cliente), required: !!body.cliente },
          { model: db.Buque, where: createFilter("buque", body.buque), required: !!body.buque },
          { model: db.semanas, where: createFilter("consecutivo", body.semana), required: !!body.semana }
        ]
      },
      { model: db.almacenes, as: "almacen", where: createFilter("nombre", body.llenado), required: !!body.llenado },
      { model: db.combos, where: createFilter("nombre", body.producto), required: !!body.producto },
      ...(shouldIncludeSeriales ? [{ model: db.serial_de_articulos, required: false }] : [])
    ];

    return { bodyFilter, includeOptions };
  }

  async paginate(offset, limit, body = {}) {
    const { bodyFilter, includeOptions } = this.buildPaginateQuery(body);
    const countIncludeOptions = includeOptions.filter(
      (include) => include.model !== db.serial_de_articulos
    );

    // Paginación
    const parsedLimit = Number(limit) || 10;
    const parsedOffset = Number(offset) ? (Number(offset) - 1) * parsedLimit : 0;

    // Consultas
    const [result, total] = await Promise.all([
      db.Listado.findAll({
        where: bodyFilter,
        limit: parsedLimit,
        offset: parsedOffset,
        order: [["id_contenedor", "DESC"], ["fecha", "DESC"]],
        include: includeOptions
      }),
      db.Listado.count({
        where: bodyFilter,
        include: countIncludeOptions,
        distinct: true,
        col: 'id'
      })
    ]);

    return { data: result, total };
  }



}

module.exports = ListadoService;



