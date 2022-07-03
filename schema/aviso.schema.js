const Joi = require('joi');

const id = Joi.string().min(3);
const descripcion = Joi.string().max(100);

const crearAviso = Joi.object({
  id: id,
  descripcion: descripcion.required()
});

const actualizarAviso = Joi.object({
  id: id,
  descripcion: descripcion
});

module.exports = { crearAviso, actualizarAviso };
