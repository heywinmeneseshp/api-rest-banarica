const boom = require('@hapi/boom');
const db = require('../../models');
const { Op, where, json } = require('sequelize');
const serial_de_articulos = require('../../models/serial_de_articulos');
const StockService = require('../stock.service');
const MovimientoService = require('../movimientos.service');
const HistorialMovimientosServiceService = require('../historialMovimientos.service');
const stockService = new StockService();
const historialMovimientoService = new HistorialMovimientosServiceService();
const movimientoService = new MovimientoService();


class SeguridadService {

  async cargarSeriales({ data, remision, pedido, semana, fecha, observaciones, username }) {
    console.log(data)

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
      const const_almacen = data[0].cons_almacen
      const dataMovimiento = {
        prefijo: "RC", remision: remision, pendiente: false, observaciones: observaciones, cons_semana: semana,
        realizado_por: username, realizado_por: username, vehiculo: null, fecha: fecha
      };
      const movimiento = await movimientoService.create(dataMovimiento);


      for (const key in countConsProductos) {
        if (countConsProductos.hasOwnProperty(key)) {
          const cons_producto = key;
          const cantidad = countConsProductos[key];
          stockService.addAmounts(const_almacen, cons_producto, { cantidad: cantidad })
          const dataHistorial = {
            cons_movimiento: movimiento.dataValues.consecutivo,
            cons_producto: cons_producto,
            cons_almacen_gestor: const_almacen,
            cons_almacen_receptor: const_almacen,
            cons_lista_movimientos: "RC",
            tipo_movimiento: "Entrada",
            razon_movimiento: null,
            cantidad: cantidad,
            cons_pedido: pedido,
          }
          await historialMovimientoService.create(dataHistorial);
        };
      }

      await t.commit();
      return { message: 'Datos cargados exitosamente', cons_movimiento: movimiento.dataValues.consecutivo };
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


        throw new boom.conflict(`Seriales duplicados detectados, ${e.original.sqlMessage}`);
      }


      throw new Error(`Error al cargar los datos: ${e.original?.sqlMessage || e.message}`);
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

    const { cons_producto = "", serial = "", bag_pack = "", s_pack = "", m_pack = "", l_pack = "", cons_almacen, available = false } = body;

    // Determinar si cons_almacen es un array o una cadena de búsqueda
    const almacenes = Array.isArray(cons_almacen) ? cons_almacen : { [Op.like]: `%${cons_almacen}%` };

    const filters = {
      cons_producto: { [Op.like]: `%${cons_producto}%` },
      serial: { [Op.like]: `%${serial}%` },
      bag_pack: { [Op.like]: `%${bag_pack}%` },
      s_pack: { [Op.like]: `%${s_pack}%` },
      m_pack: { [Op.like]: `%${m_pack}%` },
      l_pack: { [Op.like]: `%${l_pack}%` },
      cons_almacen: almacenes,
      available: { [Op.or]: available },
    };

    const includeModels = [
      { model: db.movimientos, as: 'movimiento' },
      { model: db.productos, as: 'producto' },
      { model: db.usuarios, as: 'usuario' },
      { model: db.Contenedor, as: 'contenedor' },
       { model: db.MotivoDeUso },
       { model: db.Rechazo },
      
    ];

    if (pagination) {
      const { limit, offset } = pagination;
      const parsedLimit = parseInt(limit);
      const parsedOffset = (parseInt(offset) - 1) * parsedLimit;

      const [total, result] = await Promise.all([
        db.serial_de_articulos.count({ where: filters }),
        db.serial_de_articulos.findAll({
          where: filters,
          include: includeModels,
          limit: parsedLimit,
          offset: parsedOffset,
          order: [['updatedAt', 'DESC']]
        }),
      ]);

      return { data: result, total };
    }

    return await db.serial_de_articulos.findAll({ where: filters, include: includeModels });
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
        id_rol: { [Op.in]: { [Op.or]: ["Super seguridad", "Seguridad"] } }
      },
    });
    const result = await db.usuarios.findAll({
      where: {
        username: { [Op.like]: `%${username}%` },
        id_rol: { [Op.in]: ["Super seguridad", "Seguridad"] }
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
      // 🔹 Buscar kit de inventario asociado a la bolsa
      const kitsInventario = await db.serial_de_articulos.findAll({
        where: { bag_pack: formulario.bolsa, available: true },
        transaction,
      });

      if (kitsInventario.length === 0) {
        throw new Error("❌ No se encontraron artículos asociados al kit de inventario.");
      }

      // 🔹 Contar cuántas veces aparece cada cons_producto
      const productosCantidad = kitsInventario.reduce((acc, { dataValues: article }) => {
        acc[article.cons_producto] = (acc[article.cons_producto] || 0) + 1;
        return acc;
      }, {});

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
        cons_motivo_de_uso = moviUso.id; // Guardar solo el ID
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

      // 🔹 Procesar artículos del inventario
      await Promise.all(
        kitsInventario.map(async ({ dataValues: article }) => {
          // Desactivar artículo y actualizar su estado
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

          // Restar del stock con la cantidad correcta
          await stockService.subtractAmounts(
            article.cons_almacen,
            article.cons_producto,
            { cantidad: productosCantidad[article.cons_producto] }
          );
        })
      );

      // 🔹 Registrar movimientos en historial (solo una vez por `cons_producto`)
      await Promise.all(
        Object.entries(productosCantidad).map(async ([cons_producto, cantidad]) => {
          await historialMovimientoService.create(
            {
              cons_movimiento: movimiento.consecutivo,
              cons_producto,
              cons_almacen_gestor: kitsInventario[0].dataValues.cons_almacen, // Tomamos el almacén del primer producto
              cons_almacen_receptor: kitsInventario[0].dataValues.cons_almacen, // Misma lógica
              cons_lista_movimientos: "EX",
              tipo_movimiento: "Salida",
              razon_movimiento: "Inspección antinarcóticos",
              cantidad: cantidad.toString(), // Convertimos a string si la DB lo requiere
            },
            transaction
          );
        })
      );

      // 🔹 Confirmar transacción
      await transaction.commit();
      console.log("✅ Inspección antinarcóticos completada con éxito.");
      return true
    } catch (error) {
      // 🔹 Revertir transacción en caso de error
      if (transaction) await transaction.rollback();
      console.error("🚨 Error en inspección antinarcóticos:", error.message);
      throw error;
    }
  }




}

module.exports = SeguridadService;
