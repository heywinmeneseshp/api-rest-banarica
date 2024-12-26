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
      destino: { destino: "Predeterminado", pais: "Predeterminado", cod: "PRE", habilitado: true },
      naviera: { navieras: "Predeterminado", cod: "PRE", habilitado: true },
      buque: { buque: "Predeterminado", habilitado: true },
      cliente: {
        razon_social: "Predeterminado",
        nit: 999999999,
        domicilio: "Calle predeterminada",
        telefono: 3000000000,
        email: "predeterminado@default.ex",
        activo: true,
        cod: "PRE",
        pais: "Predeterminado"
      },
      semana: { consecutivo: "S00-2000", semana: 0, anho: 2000 },
      embarque: {
        viaje: "N/A", anuncio: "N/A", sae: "N/A", booking: "N/A", bl: "N/A",
        fecha_zarpe: "2024-01-01 00:00:00", fecha_arribo: "2024-01-01 00:00:00", observaciones: "", habilitado: true
      },
      producto: { consecutivo: "PRE", nombre: "N/A", isBlock: false, },
      almacen: { consecutivo: "PRE", nombre: "N/A", isBlock: false, },

    };

    try {
      // Crear registros predeterminados si no existen
      const [destino] = await db.Destino.findOrCreate({ where: { destino: "Predeterminado" }, defaults: defaults.destino });
      const [naviera] = await db.Naviera.findOrCreate({ where: { navieras: "Predetermiando" }, defaults: defaults.naviera });
      const [buque] = await db.Buque.findOrCreate({ where: { buque: "Predetermiando" }, defaults: { ...defaults.buque, id_naviera: naviera.id } });
      const [cliente] = await db.clientes.findOrCreate({ where: { cod: "PRE" }, defaults: defaults.cliente });
      const [semana] = await db.semanas.findOrCreate({ where: { consecutivo: "S00-2000" }, defaults: defaults.semana });
      const [combo] = await db.combos.findOrCreate({ where: { consecutivo: "PRE" }, defaults: defaults.producto })
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
        realizado_por: data.username,
        vehiculo: data.vehiculo,
        fecha: data.fecha
      };

      // Asegurarse de que el motivo de uso exista
      const [moviUso] = await db.MotivoDeUso.findOrCreate({
        where: { consecutivo: "INSP01" },
        defaults: { consecutivo: "INSP01", motivo_de_uso: "Inspección vacio", habilitado: true },
        transaction
      });

      // Crear movimiento
      const movimiento = await movimientoService.create(dataMovimiento, transaction);

      // Actualizar seriales
      const serialesActualizados = await Promise.all(data.seriales.map(async item => {
        const itemSerial = {
          serial: item.value,
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
      const conteo = serialesActualizados.reduce((acc, item) => {
        const producto = item.cons_producto || 'Sin producto';
        acc[producto] = (acc[producto] || 0) + 1;
        return acc;
      }, {});

      // Procesar conteo de productos
      await Promise.all(Object.entries(conteo).map(async ([producto, cantidad]) => {
        const cons_almacen = serialesActualizados[0].cons_almacen;
        await stockService.subtractAmounts(cons_almacen, producto, { cantidad }, transaction);
        const dataHistorial = {
          cons_movimiento: movimiento.dataValues.consecutivo,
          cons_producto: producto,
          cons_almacen_gestor: cons_almacen,
          cons_almacen_receptor: cons_almacen,
          cons_lista_movimientos: "EX",
          tipo_movimiento: "Salida",
          razon_movimiento: "Inspección vacio",
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
      const itemListado = await db.Listado.create(listado, { transaction });

      // Commit de la transacción
      await transaction.commit();
      return itemListado;

    } catch (error) {
      // Rollback de la transacción en caso de error
      await transaction.rollback();
      throw boom.badRequest(error.message || 'Error al crear el listado');
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
    await db.Listado.update(changes, { where: { id } });
    return { message: 'El listado fue actualizado', id, changes };
  }

  async delete(id) {
    const listado = await db.Listado.findByPk(id);
    if (!listado) {
      throw boom.notFound('El listado no existe');
    }
    await db.Listado.destroy({ where: { id } });
    return { message: 'El listado fue eliminado', id };
  }

  async paginate(offset, limit, body = {}) {
    let fechaInicial = body.fecha_inicial ? new Date(body.fecha_inicial) : null;
    let fechaFInal = body.fecha_final ? body.fecha_final : null;
    let fechaFilter = {}
    if (fechaInicial) {
      fechaInicial.setDate(fechaInicial.getDate())
      fechaFilter = fechaFInal ? {fecha: {[Op.between]: [fechaInicial, fechaFInal]}} : {fecha: {[Op.between]: [fechaInicial, fechaInicial.getFullYear()+"-12-31"]}};
    }

    const newBody = {
      contenedor: body.contenedor || '',
      booking: body.booking || '',
      bl: body.bl || '',
      destino: body.destino || '',
      naviera: body.naviera || '',
      cliente: body.cliente || '',
      semana: body.semana || "",  // Semana recibida en el body
      buque: body.buque || '',
      llenado: body.llenado || '',
      producto: body.producto || '',
      serial: body.serial || '',
    };

    const semanaFilter = newBody.semana ? { consecutivo: { [Op.like]: `%${newBody.semana}%` } } : {};
    const contenedorFilter = newBody.contenedor ? { contenedor: { [Op.like]: `%${newBody.contenedor}%` } } : {};
    const bookingFilter = newBody.booking ? { booking: { [Op.like]: `%${newBody.booking}%` } } : {};
    const blFilter = newBody.bl ? { bl: { [Op.like]: `%${newBody.bl}%` } } : {};
    const destinoFilter = newBody.destino ? { destino: { [Op.like]: `%${newBody.destino}%` } } : {};
    const navieraFilter = newBody.naviera ? { navieras: { [Op.like]: `%${newBody.naviera}%` } } : {};
    const clienteFilter = newBody.cliente ? { cod: { [Op.like]: `%${newBody.cliente}%` } } : {};
    const buqueFilter = newBody.buque ? { buque: { [Op.like]: `%${newBody.buque}%` } } : {};
    const llenadoFilter = newBody.llenado ? { nombre: { [Op.like]: `%${newBody.llenado}%` } } : {};
    const productoFilter = newBody.producto ? { nombre: { [Op.like]: `%${newBody.producto}%` } } : {};
    // Validación de `offset` y `limit`
    const parsedOffset = isNaN(parseInt(offset)) ? 0 : (parseInt(offset) - 1) * parseInt(limit);
    const parsedLimit = isNaN(parseInt(limit)) ? 10 : parseInt(limit);

    const { rows: result, count: total } = await db.Listado.findAndCountAll({
      limit: parsedLimit,
      offset: parsedOffset,
      where: fechaFilter,
      order: [["id_contenedor", "DESC"], ['id', 'DESC']],
      include: [
        {
          model: db.Contenedor,
          where: contenedorFilter
        },
        {
          model: db.Embarque,
          where: { ...bookingFilter, ...blFilter },
          include: [
            {
              model: db.Destino,
              where: destinoFilter
            },
            {
              model: db.Naviera,
              where: navieraFilter
            },
            {
              model: db.clientes,
              where: clienteFilter
            },
            {
              model: db.Buque,
              where: buqueFilter
            },
            {
              model: db.semanas,
              where: semanaFilter,  // Aplicamos el filtro de semana
            },
          ],
        },
        {
          model: db.almacenes, as: 'almacen',
          where: llenadoFilter
        },
        {
          model: db.combos,
          where: productoFilter
        },
        {
          model: db.serial_de_articulos,
        },
      ],
    });

    return { data: result, total };
  }





}

module.exports = ListadoService;
