const Joi = require('joi');

const consecutivo = Joi.string().min(3);
const remision = Joi.string().min(2);
const observaciones = Joi.string().max(150);
const cons_semana = Joi.string().min(5);
const fecha = Joi.string();
const aprobado_por = Joi.string();
const realizado_por = Joi.string();

const ingresarRemision = Joi.object({
  consecutivo: consecutivo,
  remision: remision.required(),
  observaciones: observaciones.required(),
  cons_semana: cons_semana.required(),
  fecha: fecha.required(),
  aprobado_por: aprobado_por,
  realizado_por: realizado_por
});

const actualizarRemision = Joi.object({
  consecutivo: consecutivo,
  remision: remision,
  observaciones: observaciones,
  cons_semana: cons_semana,
  fecha: fecha,
  aprobado_por: aprobado_por,
  realizado_por: realizado_por
});

module.exports = { ingresarRemision, actualizarRemision };
