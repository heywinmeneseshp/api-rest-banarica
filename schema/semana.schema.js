const Joi = require('joi');

const id = Joi.string().min(5).max(6); //S20-22
const semana = Joi.string().length(2); //09
const anho = Joi.string().length(4); //2020

const crearSemana = Joi.object({
  id: id,
  semana: semana.required(),
  anho: anho.required()
});

const actualizarSemana = Joi.object({
  id: id,
  semana: semana,
  anho: anho
});

module.exports = { crearSemana, actualizarSemana };
