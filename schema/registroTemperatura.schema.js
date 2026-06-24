const Joi = require('joi');

const id = Joi.number().integer().positive();
const id_serial_articulo = Joi.number().integer().positive().required();
const fecha = Joi.date().required();
const hora = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).required();
const temperatura = Joi.number().min(-50).max(100).required();

const crearRegistroTemperatura = Joi.object({
  id_serial_articulo: id_serial_articulo,
  fecha: fecha,
  hora: hora,
  temperatura: temperatura
});

const actualizarRegistroTemperatura = Joi.object({
  id_serial_articulo: id_serial_articulo.optional(),
  fecha: fecha.optional(),
  hora: hora.optional(),
  temperatura: temperatura.optional()
});

const getRegistroTemperatura = Joi.object({
  id: id.required()
});

module.exports = {
  crearRegistroTemperatura,
  actualizarRegistroTemperatura,
  getRegistroTemperatura
};
