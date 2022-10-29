const boom = require('@hapi/boom');
const db = require("../models");

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
      let currentWeek = Math.floor((currentDate - firstDate) / 604800000)
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
