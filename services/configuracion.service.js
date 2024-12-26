const db = require("../models");
const { generarConsecutivoSemana } = require('../middlewares/generarId.handler');
const SemanasService = require('./semanas.service');

const serviceSemana = new SemanasService()

class ConfigService {

  constructor() { }


  async find(modulo) {
    let res = await db.configuracion.findOrCreate({
      where: { modulo: modulo },
      defaults: {
        habilitado: false
      }
    })
    if (res[0].dataValues.modulo == "Semana") {
      let moduloSemana = res[0].dataValues
      let firstDate = new Date(new Date().getFullYear(), 0);
      let currentDate = new Date();
      let currentWeek = Math.ceil((currentDate - firstDate) / 604800000);
      const semana = generarConsecutivoSemana(currentWeek, res[0].dataValues.anho_actual);
      const semana1 = generarConsecutivoSemana(currentWeek + 1, res[0].dataValues.anho_actual)
      const semana2 = generarConsecutivoSemana(currentWeek + 2, res[0].dataValues.anho_actual)
      const semana3 = generarConsecutivoSemana(currentWeek + 3, res[0].dataValues.anho_actual)
      const list = [{ semCons: semana, numb: currentWeek },
      { semCons: semana1, numb: currentWeek + 1 },
      { semCons: semana2, numb: currentWeek + 2 },
      { semCons: semana3, numb: currentWeek + 3 }]

      list.map(async week => {
        try {
          await serviceSemana.findOne(week.semCons);
        } catch (e) {
          if (week.numb == 51) {
            const nextYear = (res[0].dataValues.anho_actual * 1) + 1;
            const sem52 = generarConsecutivoSemana(52, res[0].dataValues.anho_actual);
            const sem1 = generarConsecutivoSemana(1, nextYear);
            const sem2 = generarConsecutivoSemana(2, nextYear);
            const sem3 = generarConsecutivoSemana(3, nextYear);
            await db.semanas.create({ consecutivo: week.semCons, semana: week.numb, anho: res[0].dataValues.anho_actual });
            await db.semanas.create({ consecutivo: sem52, semana: 52, anho: res[0].dataValues.anho_actual });
            await db.semanas.create({ consecutivo: sem1, semana: 1, anho: nextYear });
            await db.semanas.create({ consecutivo: sem2, semana: 2, anho: nextYear });
            await db.semanas.create({ consecutivo: sem3, semana: 3, anho: nextYear });
          }
          if (week.numb < 51) {
            await db.semanas.create({ consecutivo: week.semCons, semana: week.numb, anho: res[0].dataValues.anho_actual });
          }
        }
      })



      if (moduloSemana.semana_actual < currentWeek) {
        moduloSemana = { ...moduloSemana, semana_actual: currentWeek }
        res[0].dataValues.semana_actual = currentWeek
        this.update(moduloSemana)
      }

    }
    return res
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
