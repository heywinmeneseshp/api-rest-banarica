const db = require("../models");
const { generarConsecutivoSemana } = require('../middlewares/generarId.handler');
const SemanasService = require('./semanas.service');

const serviceSemana = new SemanasService()

class ConfigService {

  constructor() { }


  async find(modulo) {
    try {
      let res = await db.configuracion.findOrCreate({
        where: { modulo },
        defaults: { habilitado: false }
      });

      let moduloData = res[0].dataValues;

      if (moduloData.modulo === "Semana") {

        const semanaPre = await db.semanas.findOne({ where: { consecutivo: "S00-2000" } });

        if (!semanaPre) {
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
              viaje: "N/A",
              anuncio: "N/A",
              sae: "N/A",
              booking: "N/A",
              bl: "N/A",
              fecha_zarpe: "2024-01-01 00:00:00",
              fecha_arribo: "2024-01-01 00:00:00",
              observaciones: "",
              habilitado: true
            },
            producto: { nombre: "Predeterminado", isBlock: false },
            almacen: { nombre: "Predeterminado", isBlock: false }
          };

          // Crear registros predeterminados si no existen
          const [destino] = await db.Destino.findOrCreate({
            where: { destino: "Predeterminado" },
            defaults: defaults.destino,
          });

          const [naviera] = await db.Naviera.findOrCreate({
            where: { navieras: "Predeterminado" },
            defaults: defaults.naviera,
          });

          const [buque] = await db.Buque.findOrCreate({
            where: { buque: "Predeterminado", id_naviera: naviera.id },
            defaults: { ...defaults.buque, id_naviera: naviera.id },
          });

          const [cliente] = await db.clientes.findOrCreate({
            where: { cod: "PRE" },
            defaults: defaults.cliente,
          });

          const [semana] = await db.semanas.findOrCreate({
            where: { consecutivo: "S00-2000" },
            defaults: defaults.semana,
          });

          await db.combos.findOrCreate({
            where: { consecutivo: "PRE" },
            defaults: defaults.producto,
          });

          await db.almacenes.findOrCreate({
            where: { consecutivo: "PRE" },
            defaults: defaults.almacen,
          });




          await db.Embarque.findOrCreate({
            where: { booking: "N/A" },
            defaults: {
              ...defaults.embarque,
              id_semana: semana.id,
              id_cliente: cliente.id,
              id_destino: destino.id,
              id_naviera: naviera.id,
              id_buque: buque.id
            }
          });

          await db.MotivoDeUso.findOrCreate({
            where: { consecutivo: "LLEN03" },
            defaults: { consecutivo: "LLEN03", motivo_de_uso: "Lleneado de contenedor", habilitado: true },
          });
        }

        // Cálculo de semanas
        let firstDate = new Date(new Date().getFullYear(), 0);
        let currentDate = new Date();
        let currentWeek = Math.ceil((currentDate - firstDate) / 604800000);
        const year = moduloData.anho_actual ? moduloData.anho_actual : currentDate.getFullYear();
        const semanas = Array.from({ length: 4 }, (_, i) => ({
          semCons: generarConsecutivoSemana(currentWeek + i, year),
          numb: currentWeek + i
        }));

        for (const week of semanas) {
          try {
            await serviceSemana.findOne(week.semCons);
          } catch (e) {
            if (week.numb === 51) {
              const nextYear = year + 1;
              const nuevasSemanas = [
                { consecutivo: generarConsecutivoSemana(52, year), semana: 52, anho: year },
                { consecutivo: generarConsecutivoSemana(1, nextYear), semana: 1, anho: nextYear },
                { consecutivo: generarConsecutivoSemana(2, nextYear), semana: 2, anho: nextYear },
                { consecutivo: generarConsecutivoSemana(3, nextYear), semana: 3, anho: nextYear }
              ];
              await db.semanas.bulkCreate([...nuevasSemanas, { consecutivo: week.semCons, semana: week.numb, anho: year }]);
            } else if (week.numb < 51) {
              await db.semanas.create({ consecutivo: week.semCons, semana: week.numb, anho: year });
            }
          }
        }

        // Actualización de la semana si es necesario
        if (moduloData.semana_actual < currentWeek) {
          moduloData.semana_actual = currentWeek;
          res[0].dataValues.semana_actual = currentWeek;
          await this.update(moduloData);
        }
      }

      return res;
    } catch (error) {
      console.error("Error en la función find:", error);
      throw error;
    }
  }

  async update(data) {
    return await db.configuracion.update(data, {
      where: {
        modulo: data.modulo
      }
    })
  }
}

module.exports = ConfigService
