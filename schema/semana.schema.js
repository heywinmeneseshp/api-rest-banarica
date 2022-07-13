const Joi = require('joi');

const consecutivo = Joi.string().min(5).max(6); //S20-22
const semana = Joi.string().length(2); //09
const anho = Joi.string().length(4); //2020

const crearSemana = Joi.object({
  consecutivo: consecutivo,
  semana: semana.required(),
  anho: anho.required()
});

const actualizarSemana = Joi.object({
  consecutivo: consecutivo,
  semana: semana,
  anho: anho
});

module.exports = { crearSemana, actualizarSemana };
