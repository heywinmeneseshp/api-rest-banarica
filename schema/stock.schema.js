const Joi = require('joi');

const cons_almacen = Joi.string();
const cons_producto = Joi.string();
const isBlock = Joi.boolean();
const cantidad = Joi.number()


const crearProductoEnAlmacen = Joi.object({
  cons_almacen: cons_almacen.required(),
  cons_producto: cons_producto.required(),
  cantidad: cantidad,
  isBlock: isBlock.required()
});

const addAndSubtract = Joi.object({
  cantidad: cantidad,
});

const habilitarDeshabilitar = Joi.object({
  isBlock: isBlock.required()
});

module.exports = { crearProductoEnAlmacen, addAndSubtract, habilitarDeshabilitar };
