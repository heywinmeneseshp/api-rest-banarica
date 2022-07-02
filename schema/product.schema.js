const Joi = require('joi');

//Validar esquemas de los datos recibidos.

const id = Joi.string().alphanum().min(4);
const name = Joi.string().min(4).max(35);
const id_categoria = Joi.string().alphanum().min(4);
const id_proveedor = Joi.string().alphanum().min(4);
const salida_sin_stock = Joi.boolean();
const serial = Joi.boolean();
const permitirTraslados = Joi.boolean();
const costo = Joi.number();
const isBlock = Joi.boolean();

const crearProducto = Joi.object({
  id: id.required(),
  name: name.required(),
  id_categoria: id_categoria.required(),
  id_proveedor: id_proveedor.required(),
  salida_sin_stock: salida_sin_stock.required(),
  serial: serial.required(),
  permitirTraslados: permitirTraslados.required(),
  costo: costo.required(),
  isBlock: isBlock.required()
})

const actualizarProducto = Joi.object({
  id: id,
  name: name,
  id_categoria: id_categoria,
  id_proveedor: id_proveedor,
  salida_sin_stock: salida_sin_stock,
  serial: serial,
  permitirTraslados: permitirTraslados,
  costo: costo,
  isBlock: isBlock
})

module.exports = { crearProducto, actualizarProducto }
