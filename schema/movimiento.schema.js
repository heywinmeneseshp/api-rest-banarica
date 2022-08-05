const Joi = require('joi');

const prefijo = Joi.string().min(2);
const pendiente = Joi.boolean();
const observaciones = Joi.string().max(150);
const semana = Joi.string().min(5);
const fecha = Joi.string();

const crearMovimiento = Joi.object({
  prefijo: prefijo.required(),
  pendiente: pendiente.required(),
  observaciones: observaciones,
  cons_semana: semana.required(),
  fecha: fecha.required()
});

const actualizarMovimiento = Joi.object({
  prefijo: prefijo,
  pendiente: pendiente,
  observaciones: observaciones,
  cons_semana: semana,
  fecha: fecha
});

module.exports = { crearMovimiento, actualizarMovimiento };
