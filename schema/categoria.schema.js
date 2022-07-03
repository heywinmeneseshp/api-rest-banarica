const Joi = require('joi');

//Validar esquemas de los datos recibidos.

const id = Joi.string().alphanum().min(4);
const nombre = Joi.string().min(4).max(35);
const id_categoria = Joi.string().alphanum().min(4);
const isBlock = Joi.boolean();

const crearcategoria = Joi.object({
  id: id,
  nombre: nombre.required(),
  isBlock: isBlock.required()
})

const actualizarCategoria = Joi.object({
  id: id,
  nombre: nombre,
  isBlock: isBlock
})

module.exports = { crearcategoria, actualizarCategoria }
