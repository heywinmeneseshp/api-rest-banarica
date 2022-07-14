
const boom = require('@hapi/boom');
const getDate = require('../middlewares/getDate.handler')
const db = require('../models');

class RecepcionService {

  constructor() {
    this.items = [];
    this.generate();
  }

  generate() {
    this.items.push({
      id: "TR-0",
      transportadora: "374656",
      conductor: "Lorem",
      vehiculo: "S21-22",
      origen: "302",
      destino: "202",
      estado: "enviado",
      semana: "S2-22",
      fecha_salida: getDate(),
      fecha_entrada: getDate()
    });
  }

  async create(data) {
    const { count } = await db.traslados.findAndCountAll();
    const consecutivo = "TR-" + count;
    const itemNuevo = { consecutivo, ...data }
    await db.traslados.create(itemNuevo);
    return itemNuevo
  }

  async find() {
    return await db.traslados.findAll();
  }

  async findOne(consecutivo) {
    const item = await db.traslados.findOne({ where: { consecutivo: consecutivo } });
    if (!item) throw boom.notFound('El item no existe')
    return item;
  }

  async update(id, changes) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.update(changes)
    return traslados
  }

  async delete(id) {
    const traslados = await db.traslados.findByPk(id);
    if (!traslados) throw boom.notFound('El item no existe');
    await traslados.destroy({ where: { id } });
    return { message: "El item fue eliminado" };
  }

}

module.exports = RecepcionService
