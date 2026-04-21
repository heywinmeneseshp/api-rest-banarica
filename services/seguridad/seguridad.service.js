const boom = require('@hapi/boom');
const db = require('../../models');
const { Op, where, json } = require('sequelize');
const serial_de_articulos = require('../../models/serial_de_articulos');
const { ROLES } = require('../../middlewares/auth.handler');
const StockService = require('../stock.service');
const MovimientoService = require('../movimientos.service');
const HistorialMovimientosServiceService = require('../historialMovimientos.service');
const stockService = new StockService();
const historialMovimientoService = new HistorialMovimientosServiceService();
const movimientoService = new MovimientoService();


class SeguridadService {

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

    const batchSize = 500; // Tamaño del lote
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
          serial === duplicatedValue || // El que causó el error
          allSerials.indexOf(serial) !== allSerials.lastIndexOf(serial) // Otros duplicados en el lote
        );

        // Eliminar duplicados del array para mostrar lista única
        const uniqueDuplicates = [...new Set(duplicateSerials)];


        throw new boom.conflict(`Seriales duplicados detectados: ${e.original.sqlMessage}`);
      }


      throw boom.badRequest(e.message || e.original?.sqlMessage || 'Error al cargar los datos.');
    }
  }


  async actualizarSeriales(data) {

    const batchSize = 100; // Tamaño del lote, ajustable según tus necesidades
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

        // Crear un mapa para búsquedas rápidas
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
      return { message: "Datos cargados con éxito" };
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
      cons_almacen, available
    } = body;

    // 1. Construcción dinámica de filtros para mejorar el rendimiento de la DB
    const filters = {};

    if (cons_producto) filters.cons_producto = cons_producto;
    if (serial) filters.serial = { [Op.like]: `%${serial}%` };
    if (bag_pack) filters.bag_pack = { [Op.like]: `%${bag_pack}%` };
    if (s_pack) filters.s_pack = { [Op.like]: `%${s_pack}%` };
    if (m_pack) filters.m_pack = { [Op.like]: `%${m_pack}%` };
    if (l_pack) filters.l_pack = { [Op.like]: `%${l_pack}%` };

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

    // 2. Lógica de Paginación Centralizada
    if (pagination) {
      const limit = parseInt(pagination.limit) || 10;
      const page = parseInt(pagination.offset) || 1;
      const offset = (page - 1) * limit;


      // findAndCountAll ejecuta ambas consultas de forma óptima
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

    // Retorno sin paginación
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
      // Usa la transacción proporcionada o crea una nueva si no se proporciona
      if (!transaction) {
        t = await db.sequelize.transaction();
      } else {
        t = transaction;
      }

      // Obtén el registro antes de la actualización
      const item = await db.serial_de_articulos.findOne({
        where: {
          serial: body.serial
        },
        transaction: t
      });

      if (!item) {
        // Si no se encuentra el ítem, realiza un rollback si se creó una transacción
        if (!transaction) {
          await t.rollback();
        }
        return { affectedRows: 0, updatedItem: null };
      }

      // Realiza la actualización
      const [affectedRows] = await db.serial_de_articulos.update(body, {
        where: {
          serial: body.serial
        },
        transaction: t
      });

      let updatedItem = null;
      if (affectedRows > 0) {
        // Refresca el ítem para asegurarte de obtener los datos actualizados
        updatedItem = await item.reload({ transaction: t });
      }

      // Confirma la transacción si se creó dentro de esta función
      if (!transaction) {
        await t.commit();
      }

      return { affectedRows, updatedItem };

    } catch (error) {
      // Realiza un rollback si se creó una transacción
      if (t) {
        await t.rollback();
      }
      // Maneja el error
      throw boom.badRequest(error.message || 'Error al actualizar el serial');
    }
  }


  async inspeccionAntinarcoticos(body) {
    const { formulario, rechazos } = body;
    console.log(rechazos);
    // Validar datos requeridos
    if (!formulario || !formulario.consecutivo || !formulario.fecha) {
      throw new Error("Datos insuficientes para realizar la inspección.");
    }

    const transaction = await db.sequelize.transaction(); // Iniciar una transacción
    try {
      // Crear inspección
      await db.Inspeccion.create(
        {
          id_contenedor: formulario.consecutivo,
          fecha_inspeccion: formulario.fecha,
          hora_inicio: formulario.hora_inicio,
          hora_fin: formulario.hora_fin,
          agente: formulario.agente,
          habilitado: true,
          zona: formulario.zona
        },
        { transaction }
      );

      // Asegurar motivo de uso
      const [moviRechazo] = await db.MotivoDeRechazo.findOrCreate({
        where: { motivo_rechazo: "Inspección antinarcóticos" },
        defaults: {
          habilitado: true,
        },
        transaction,
      });

      // Crear rechazos en paralelo
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

      // Buscar kit de inventario
      const kitsInventario = await db.serial_de_articulos.findAll({
        where: { bag_pack: formulario.bolsa, available: true },
        transaction,
      });

      if (kitsInventario.length === 0) {
        throw new Error("No se encontraron artículos asociados al kit de inventario.");
      }

      // Asegurar motivo de uso
      const [moviUso] = await db.MotivoDeUso.findOrCreate({
        where: { consecutivo: "INSP02" },
        defaults: {
          consecutivo: "INSP02",
          motivo_de_uso: "Inspección antinarcóticos",
          habilitado: true,
        },
        transaction,
      });

      // Crear movimiento
      const movimiento = await movimientoService.create(
        {
          prefijo: "EX",
          pendiente: false,
          fecha: formulario.fecha,
          cons_semana: formulario.semana,
        },
        transaction
      );

      // Procesar artículos del inventario
      await Promise.all(
        kitsInventario.map(async (item) => {
          const article = item.dataValues;

          // Desactivar artículo y actualizar su estado
          await db.serial_de_articulos.update(
            {
              available: false,
              fecha_de_uso: formulario.fecha,
              id_contenedor: formulario.consecutivo,
              ubicacion_en_contenedor: "Exterior",
              id_usuario: formulario?.id_usuario,
              id_motivo_de_uso: moviUso.id,
            },
            {
              where: { id: article.id, available: true },
              transaction,
            }
          );

          // Restar del stock
          await stockService.subtractAmounts(article.cons_almacen, article.cons_producto, { cantidad: 1 });

          // Registrar movimiento en historial
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

      // Confirmar transacción
      await transaction.commit();
    } catch (error) {
      // Revertir transacción en caso de error
      if (transaction) await transaction.rollback();
      console.error("Error en inspección antinarcóticos:", error);
      throw error;
    }
  }

  async usarSeriales(body) {
    const { formulario, motivo_de_uso } = body;
    console.log(body);

    // Iniciar una transacción
    const transaction = await db.sequelize.transaction();

    try {
      // 🔹 Buscar kit de inventario
      const kitsInventario = await db.serial_de_articulos.findAll({
        where: { bag_pack: formulario.bolsa, available: true },
        transaction,
      });

      if (kitsInventario.length === 0) {
        throw new Error("❌ No se encontraron artículos asociados al kit de inventario.");
      }

      // 🔹 Contar cuántas veces aparece cada cons_producto
      const productosCantidad = {};
      kitsInventario.forEach(({ dataValues: article }) => {
        productosCantidad[article.cons_producto] = (productosCantidad[article.cons_producto] || 0) + 1;
      });

      // 🔹 Asegurar motivo de uso
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

      // 🔹 Crear movimiento de salida
      const movimiento = await movimientoService.create(
        {
          prefijo: "EX",
          pendiente: false,
          fecha: formulario.fecha,
          cons_semana: formulario.semana,
        },
        transaction
      );

      // 🔹 1. PRIMERO: Actualizar cada artículo individualmente
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
            throw new Error(`❌ No se pudo actualizar el artículo con ID: ${article.id}`);
          }
        })
      );

      // 🔹 2. SEGUNDO: Restar del stock (SOLO UNA VEZ POR PRODUCTO)
      // Obtener productos únicos
      const productosUnicos = [...new Set(kitsInventario.map(item => item.dataValues.cons_producto))];

      await Promise.all(
        productosUnicos.map(async (cons_producto) => {
          // Encontrar el primer artículo de este producto para obtener su almacén
          const primerArticulo = kitsInventario.find(
            item => item.dataValues.cons_producto === cons_producto
          );

          if (!primerArticulo) return;
          console.log(
            primerArticulo.dataValues.cons_almacen,  // primer parámetro: cons_almacen
            cons_producto,                          // segundo parámetro: cons_producto
            { cantidad: productosCantidad[cons_producto] }, "heywin")
          // Llamar a subtractAmounts con los parámetros correctos
          await stockService.subtractAmounts(
            primerArticulo.dataValues.cons_almacen,  // primer parámetro: cons_almacen
            cons_producto,                          // segundo parámetro: cons_producto
            { cantidad: productosCantidad[cons_producto] }  // tercer parámetro: body con cantidad
          );

          console.log(`✅ Restado stock: ${cons_producto}, cantidad: ${productosCantidad[cons_producto]}, almacén: ${primerArticulo.dataValues.cons_almacen}`);
        })
      );

      // 🔹 3. Registrar movimientos en historial
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
              razon_movimiento: "Inspección antinarcóticos",
              cantidad: cantidad.toString(),
            },
            transaction
          );
        })
      );

      // 🔹 Confirmar transacción
      await transaction.commit();
      console.log("✅ Inspección antinarcóticos completada con éxito.");
      return true;

    } catch (error) {
      // 🔹 Revertir transacción en caso de error
      if (transaction) await transaction.rollback();
      console.error("🚨 Error en inspección antinarcóticos:", error.message);
      throw error;
    }
  }




}

module.exports = SeguridadService;
