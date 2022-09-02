const Joi = require('joi');

const prefijo = Joi.string().min(2);
const pendiente = Joi.boolean();
const observaciones = Joi.string().max(150);
const semana = Joi.string().min(5);
const fecha = Joi.string();
const remision = Joi.string();
const respuesta = Joi.string();

const crearMovimiento = Joi.object({
  prefijo: prefijo.required(),
  remision: remision,
  pendiente: pendiente.required(),
  observaciones: observaciones,
  cons_semana: semana.required(),
  fecha: fecha.required(),
  respuesta: respuesta,
});

const actualizarMovimiento = Joi.object({
  prefijo: prefijo,
  remision: remision,
  pendiente: pendiente,
  observaciones: observaciones,
  cons_semana: semana,
  fecha: fecha,
  respuesta: respuesta,
});

module.exports = { crearMovimiento, actualizarMovimiento };
