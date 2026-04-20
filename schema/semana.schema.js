const Joi = require('joi');

const consecutivo = Joi.string().min(5).max(6); //S20-22
const semana = Joi.string().length(2); //09
const anho = Joi.string().length(4); //2020
const fecha = Joi.date().iso();
const dias_semana = Joi.number().integer().min(1).max(7);

const crearSemana = Joi.object({
  consecutivo: consecutivo,
  semana: semana.required(),
  anho: anho.required(),
  fecha_inicio: fecha,
  fecha_fin: fecha,
  dias_semana: dias_semana,
});

const actualizarSemana = Joi.object({
  consecutivo: consecutivo,
  semana: semana,
  anho: anho,
  fecha_inicio: fecha,
  fecha_fin: fecha,
  dias_semana: dias_semana,
});

module.exports = { crearSemana, actualizarSemana };
