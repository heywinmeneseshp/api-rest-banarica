const boom = require('@hapi/boom');
const db = require("../models");

class ConfigService {

  constructor() { }


  async find(modulo) {
    const res = await db.configuracion.findOrCreate({
      where: { modulo: modulo },
      defaults: {
        habilitado: false
      }
    })
    return res
  }

  async udate(data) {
    return await db.configuracion.update(data, {
      where: {
        modulo: data.modulo
      }
    })
  }
}

module.exports = ConfigService
