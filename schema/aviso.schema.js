const Joi = require('joi');

const consecutivo = Joi.string().min(3);
const descripcion = Joi.string().max(100);

const crearAviso = Joi.object({
  consecutivo: consecutivo,
  descripcion: descripcion.required()
});

const actualizarAviso = Joi.object({
  consecutivo: consecutivo,
  descripcion: descripcion
});

module.exports = { crearAviso, actualizarAviso };
