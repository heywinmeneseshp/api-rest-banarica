const Joi = require('joi');

const consecutivo = Joi.string().min(3);
const remision = Joi.string().min(2);
const observaciones = Joi.string().max(150);
const cons_semana = Joi.string().min(5);

const ingresarRemision = Joi.object({
  consecutivo: consecutivo,
  remision: remision.required(),
  observaciones: observaciones.required(),
  cons_semana: cons_semana.required()
});

const actualizarRemision = Joi.object({
  consecutivo: consecutivo,
  remision: remision,
  observaciones: observaciones,
  cons_semana: cons_semana
});

module.exports = { ingresarRemision, actualizarRemision };
