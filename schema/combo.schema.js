const Joi = require('joi');

const id = Joi.string().min(3);
const descripcion = Joi.string().max(100);
const id_producto = Joi.string().min(3);
const id_combo = Joi.string().min(3);
const isBlock = Joi.boolean();

const crearCombo = Joi.object({
  id: id,
  nombre: descripcion.required(),
  isBlock: isBlock.required(),
});

const actualizarCombo = Joi.object({
  id: id,
  nombre: descripcion,
  isBlock: isBlock
});

const armarCombo = Joi.object({
  id_combo: id_combo.required(),
  id_producto: id_producto.required(),
})

module.exports = { crearCombo, actualizarCombo, armarCombo };
descripcion
