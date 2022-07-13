const Joi = require('joi');

const cons_almacen = Joi.string();
const cons_producto = Joi.string();
const isBlock = Joi.string();
const cantidad = Joi.number()


const crearProductoEnAlmacen = Joi.object({
  cons_almacen: cons_almacen.required(),
  cons_producto: cons_producto.required(),
  isBlock: isBlock.required()
});

const addAndSubtract = Joi.object({
  cons_almacen: cons_almacen.required(),
  cons_producto: cons_producto.required(),
  cantidad: cantidad.required()
});

module.exports = { crearProductoEnAlmacen, addAndSubtract };
