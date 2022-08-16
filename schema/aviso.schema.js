const Joi = require('joi');

const descripcion = Joi.string();

const crearAviso = Joi.object({
  descripcion: descripcion.required()
});

const actualizarAviso = Joi.object({
  descripcion: descripcion
});

module.exports = { crearAviso, actualizarAviso };
