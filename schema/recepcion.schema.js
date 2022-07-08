const Joi = require('joi');

const remision = Joi.string().min(2);
const observaciones = Joi.string().max(150);
const id_semana = Joi.string().min(5);

const ingresarRemision = Joi.object({
  remision: remision.required(),
  observaciones: observaciones.required(),
  id_semana: id_semana.required()
});

const actualizarRemision = Joi.object({
  remision: remision,
  observaciones: observaciones,
  id_semana: id_semana
});

module.exports = { ingresarRemision, actualizarRemision };
