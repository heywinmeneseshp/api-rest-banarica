
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
        attributes: ['fecha', 'vehiculo_id', "semana", "conductor_id"],
        group: ['fecha', 'vehiculo_id']
      });



      // Recolectar todos los resultados en un solo array
      const resultados = await Promise.all(fechasUnicas.map(async (item) => {
        const semana = item.semana;
        const conductor_id = item.conductor_id
        const [record_consumo] = await db.record_consumos.findOrCreate({
          where: { vehiculo_id: item.vehiculo_id, fecha: item.fecha },
          defaults: {
            liquidado: false,
            activo: true,
            semana: semana,  // Asegúrate de que item tenga estos campos
            conductor_id: conductor_id,
            tanqueo: 0,
          },
          include: [
            { model: db.vehiculo },
          ]
        });
        return record_consumo;
      }));

      return resultados; // Devuelve los resultados obtenidos
    } catch (error) {
      console.error('Error in sinLiquidar:', error);
      throw error; // Propaga el error para que pueda ser manejado por el llamador
    }
  }

  async consultarConsumo(body) {
    try {
      const rutas_programadas = await db.programacion.findAll({
        where: body,
        include: [
          { model: db.vehiculo }
        ]
      });
      var suma = 0
      rutas_programadas.map(item => {
        const categoria_vehiculo = item.dataValues.vehiculo.dataValues.categoria_id
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

    const stock_real = body.stock_real * 1
    const tanqueo = body.tanqueo * 1
    const record_consumo_id = body.record_consumo_id

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

    let consumo = item.dataValues.km_recorridos * item.dataValues.vehiculo.dataValues.gal_por_km;

    programaciones.map(async item => {
      await db.programacion.update({ activo: false }, { where: { id: item.dataValues.id } })
    })

    await db.vehiculo.update({ combustible: stock_real }, { where: { id: item.dataValues.vehiculo.dataValues.id } })
    const stock_final = programaciones[0].dataValues.vehiculo.dataValues.combustible + tanqueo - consumo;
    const variacionPorcentual = ((stock_real - stock_final) / stock_real) * 100;

    if (variacionPorcentual >= 5 || variacionPorcentual <= -5) {
      const restaCinco = variacionPorcentual > 0 ? variacionPorcentual - 5 : variacionPorcentual + 5;
      const notiData = {
        consecutivo: "NT-" + (Date.now() - 1662564279341),
        cons_movimiento: record_consumo_id,
        tipo_movimiento: "Combustible",
        descripcion: `El vehículo ${item.dataValues.vehiculo.dataValues.placa} supera el límite de consumo con ${(stock_real * restaCinco).toFixed(2)} galones.`,
        dif_porcentual_consumo: variacionPorcentual.toFixed(2),
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
    await db.record_consumos.update(changes, { where: { id } });
    const result = await db.record_consumos.findOne({ where: { id } });
    var fechaOriginal = new Date(result.dataValues.fecha);
    // Sumar un día
    const fecha = new Date(fechaOriginal)
    // Clonar la fecha original para no modificarla directamente
    var fechaNueva = new Date(fecha);
    // Sumar un día
    fechaNueva.setDate(fechaNueva.getDate() + 1);
    // Formatear la nueva fecha en el formato deseado (YYYY-MM-DD)
    var fechaFormateada = fechaNueva.toISOString().slice(0, 10);

    const nextResult = await db.record_consumos.findOne({ where: { fecha: fechaFormateada, vehiculo_id: result.dataValues.vehiculo_id } });
    const res = { ...result.dataValues, nextItem: nextResult }
    return res;
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
    if (item.fechaFin) {
      const inicio = new Date(item.fecha);
      const fin = new Date(item.fechaFin);
      body.fecha = { [Op.between]: [inicio, fin] }
    }
    delete body.fechaFin;
    if (item.semana) body.semana = item.semana
    if (item.liquidado == null) {
      body.liquidado = [true, false]
    } else {
      body.liquidado = item?.liquidado
    }
    const vehiculo = item?.vehiculo || ""
    const conductor = item?.conductor || ""

    let whereClause = {
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
      order: [['fecha', 'DESC']],
    }


    if (limit != null) {
      let newLimit = parseInt(limit);
      let newOffset = (parseInt(offset) - 1) * newLimit;
      whereClause = {
        ...whereClause,
        limit: newLimit,
        offset: newOffset
      }
    }



    const { count, rows } = await db.record_consumos.findAndCountAll(whereClause);
    return { data: rows, total: count };
  }

}

module.exports = record_consumosService
