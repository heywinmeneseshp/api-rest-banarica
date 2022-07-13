const Joi = require('joi');

const consecutivo = Joi.string().min(3);
const descripcion = Joi.string().max(100);
const cons_producto = Joi.string().min(3);
const cons_combo = Joi.string().min(3);
const isBlock = Joi.boolean();

const crearCombo = Joi.object({
  consecutivo: consecutivo,
  nombre: descripcion.required(),
  isBlock: isBlock.required(),
});

const actualizarCombo = Joi.object({
  consecutivo: consecutivo,
  nombre: descripcion,
  isBlock: isBlock
});

const armarCombo = Joi.object({
  cons_combo: cons_combo.required(),
  cons_producto: cons_producto.required(),
})

module.exports = { crearCombo, actualizarCombo, armarCombo };
descripcion
