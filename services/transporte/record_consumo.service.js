
const boom = require('@hapi/boom');
const { Op } = require('sequelize');
const db = require('../../models');


class record_consumosService {

  async create(data) {
    const existe = await db.record_consumos.findOne({ where: data });
    if (existe !== null) {
      throw boom.conflict('El item ya existe');
    } else {
      const newAlmacen = await db.record_consumos.create(data);
      return newAlmacen;
    }
  }


  async find() {
    const res = await db.record_consumos.findAll()

    return res;
  }


  async sinLiquidar() {
    try {
      // Busca todas las fechas únicas de programación para vehículos activos
      const fechasUnicas = await db.programacion.findAll({
        where: { activo: true },
        attributes: ['fecha', 'vehiculo_id'],
        group: ['fecha', 'vehiculo_id']
      });

      const resultados = await Promise.all(fechasUnicas.map(async item => {
        // Busca la categoría del vehículo
        const categoriaVehiculo = await db.vehiculo.findOne({ where: { id: item.vehiculo_id } });
        const categoriaId = categoriaVehiculo.dataValues.categoria_id;

        // Busca las programaciones asociadas a la fecha y al vehículo
        const programaciones = await db.programacion.findAll({
          where: { fecha: item.fecha, activo: true, vehiculo_id: item.vehiculo_id },
          include: [
            {
              model: db.rutas,
              include: [
                { model: db.ubicaciones, as: 'ubicacion_1' },
                { model: db.ubicaciones, as: 'ubicacion_2' },
                { model: db.galones_por_ruta, where: { categoria_id: categoriaId } },
              ]
            },
            { model: db.vehiculo }
          ]
        });

        // Busca o crea el registro de consumo 
        const record_consumo = await db.record_consumos.findOrCreate({
          where: { vehiculo_id: item.vehiculo_id, fecha: item.fecha },
          defaults: {
            liquidado: false,
            activo: true,
            semana: programaciones[0].semana,
            conductor_id: programaciones[0].conductor_id,
            tanqueo: 0,
          }
        });
        // Calcula el consumo total de galones por ruta para todas las programaciones
        let consumo = 0;
        programaciones.forEach(element => {
          consumo += element.ruta.galones_por_ruta[0].galones_por_ruta;
        });

        const tanqueos = await db.tanqueos.findAll({
          where: {
            record_consumo_id: record_consumo[0].dataValues.id
          }
        });


        var tanqueo = 0
        tanqueos.map(item => {
          tanqueo = tanqueo + item.dataValues.tanqueo
        })


        // Retorna un objeto con las programaciones, consumo y otros detalles
        return {
          programacion: programaciones,
          consumo: consumo,
          fecha: item.fecha,
          vehiculo_id: item.vehiculo_id,
          placa: programaciones[0].vehiculo.placa,
          stock_inicial: programaciones[0].vehiculo.combustible,
          record_consumo: record_consumo,
          tanqueo: tanqueo
        };
      }));

      return resultados; // Devuelve los resultados obtenidos
    } catch (error) {
      console.error('Error en sinLiquidar:', error);
      throw error; // Lanza el error para que sea manejado en otro lugar si es necesario
    }
  }

  async consultarConsumo(body) {
    try {
      const rutas_programadas = await db.programacion.findAll({
        where: body,
        include: [
          {
            model: db.rutas,
            include: [
              { model: db.ubicaciones, as: 'ubicacion_1' },
              { model: db.ubicaciones, as: 'ubicacion_2' },
              { model: db.galones_por_ruta },
            ]
          },
          { model: db.vehiculo }
        ]
      });
      var suma = 0
      rutas_programadas.map(item => {
        const categoria_vehiculo = item.dataValues.vehiculo.dataValues.categoria_id
        console.log(item.dataValues.vehiculo_id)
        const array = item.dataValues.ruta.dataValues.galones_por_ruta.find(element => {
          return element.dataValues.categoria_id == categoria_vehiculo
        })
        suma = suma + array.dataValues.galones_por_ruta
      })

      return { rutas_programadas, consumo: suma };
    } catch (error) {
      console.error("Error al consultar el consumo:", error);
      throw new Error("Error al consultar el consumo");
    }
  }

  async liquidar(body) {
    const { record_consumo_id, stock_real } = body;

    const item = await db.record_consumos.findOne({
      where: { id: record_consumo_id },
      include: [
        { model: db.vehiculo },
      ]
    });
    const programaciones = await db.programacion.findAll({
      where: { fecha: item.dataValues.fecha, activo: true, vehiculo_id: item.dataValues.vehiculo_id },
      include: [
        { model: db.vehiculo }
      ]
    });

    const arrayTanqueo = await db.tanqueos.findAll({ where: { record_consumo_id: record_consumo_id } });

    let tanqueo = 0;

    arrayTanqueo.map(async item => {
      await db.tanqueos.update({ activo: false }, { where: { id: item.dataValues.id } })
      tanqueo = tanqueo + item.dataValues.tanqueo
    })
    let consumo = item.dataValues.km_recorridos * item.dataValues.vehiculo.dataValues.gal_por_km;

    programaciones.map(async item => {
      await db.programacion.update({ activo: false }, { where: { id: item.dataValues.id } })
    })

    await db.vehiculo.update({ combustible: stock_real }, { where: { id: item.dataValues.vehiculo.dataValues.id } })

    const stock_final = programaciones[0].dataValues.vehiculo.dataValues.combustible + tanqueo - consumo;
    const variacionPorcentual = ((stock_real - stock_final) / stock_real) * 100;

    if (variacionPorcentual >= 5 || variacionPorcentual <= -5) {
      const restaCinco = variacionPorcentual > 0 ? variacionPorcentual-5 : variacionPorcentual+5;
      const notiData = {
        consecutivo: "NT-" + (Date.now() - 1662564279341),
        cons_movimiento: record_consumo_id,
        tipo_movimiento: "Combustible",
        descripcion: `El vehículo ${item.dataValues.vehiculo.dataValues.placa} supera el límite de consumo con ${stock_real * restaCinco} galones.`,
        dif_porcentual_consumo: variacionPorcentual,
        aprobado: false,
        visto: false
      }
      await db.notificaciones.create(notiData)
    }

    const res = await db.record_consumos.update(
      {
        activo: true,
        liquidado: true,
        stock_inicial: programaciones[0].dataValues.vehiculo.dataValues.combustible,
        stock_real: stock_real,
        gal_por_km: item.dataValues.vehiculo.dataValues.gal_por_km,
        tanqueo: tanqueo,
        stock_final: stock_final
      },
      {
        where: { id: record_consumo_id }
      });


    return res
  }



  async findOne(data) {
    const item = await db.record_consumos.findOne({ where: data });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const item = await db.record_consumos.findOne({ where: { id } });
    if (!item) throw boom.notFound('El item no existe')
    const result = await db.record_consumos.update(changes, { where: { id } });
    return result;
  }

  async delete(id) {
    const existe = await db.record_consumos.findOne({ where: { id } });
    if (!existe) throw boom.notFound('El item no existe');
    await db.record_consumos.destroy({ where: { id } });
    return { message: "El item fue eliminado", id }
  }

  async paginate(offset, limit, item) {

    let body = {}
    if (item.fecha) body.fecha = item.fecha
    if (item.semana) body.semana = item.semana
    if (item.liquidado == null) {
      body.liquidado = [true, false]
    } else {
      body.liquidado = item.liquidado
    }
    const vehiculo = item.vehiculo || ""
    const conductor = item.conductor || ""

    let newLimit = parseInt(limit);
    let newOffset = (parseInt(offset) - 1) * newLimit;

    const { count, rows } = await db.record_consumos.findAndCountAll({
      where: body,
      include: [
        {
          model: db.vehiculo,
          where: { placa: { [Op.like]: `%${vehiculo}%` } }
        },
        {
          model: db.conductores,
          where: { conductor: { [Op.like]: `%${conductor}%` } }
        }
      ],
      limit: newLimit,
      offset: newOffset
    });
    return { data: rows, total: count };
  }

}

module.exports = record_consumosService
