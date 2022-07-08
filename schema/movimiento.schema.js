const Joi = require('joi');

const prefijo = Joi.string().min(2);
const pendiente = Joi.boolean();
const observaciones = Joi.string().max(150);
const semana = Joi.string().min(5);

const crearMovimiento = Joi.object({
  prefijo: prefijo.required(),
  pendiente: pendiente.required(),
  observaciones: observaciones.required(),
  id_semana: semana.required()
});

const actualizarMovimiento = Joi.object({
  pendiente: pendiente
});

module.exports = { crearMovimiento, actualizarMovimiento };
