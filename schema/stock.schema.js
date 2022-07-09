const Joi = require('joi');

const id_almacen = Joi.string();
const id_producto = Joi.string();
const isBlock = Joi.string();
const cantidad = Joi.number()


const crearProductoEnAlmacen = Joi.object({
  id_almacen: id_almacen.required(),
  id_producto: id_producto.required(),
  isBlock: isBlock.required()
});

const addAndSubtract = Joi.object({
  id_almacen: id_almacen.required(),
  id_producto: id_producto.required(),
  cantidad: cantidad.required()
});

module.exports = { crearProductoEnAlmacen, addAndSubtract };
