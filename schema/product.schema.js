const Joi = require('joi');

//Validar esquemas de los datos recibidos.

const consecutivo = Joi.string().min(4);
const name = Joi.string();
const cons_categoria = Joi.string().min(4);
const cons_proveedor = Joi.string().min(4);
const salida_sin_stock = Joi.boolean();
const serial = Joi.boolean();
const permitir_traslados = Joi.boolean();
const costo = Joi.number();
const bulto = Joi.number();
const isBlock = Joi.boolean();

const crearProducto = Joi.object({
  consecutivo: consecutivo,
  name: name.required(),
  bulto: bulto.required(),
  cons_categoria: cons_categoria.required(),
  cons_proveedor: cons_proveedor.required(),
  salida_sin_stock: salida_sin_stock.required(),
  serial: serial.required(),
  permitir_traslados: permitir_traslados.required(),
  costo: costo.required(),
  isBlock: isBlock.required()
})

const actualizarProducto = Joi.object({
  consecutivo: consecutivo,
  name: name,
  bulto: bulto,
  cons_categoria: cons_categoria,
  cons_proveedor: cons_proveedor,
  salida_sin_stock: salida_sin_stock,
  serial: serial,
  permitir_traslados: permitir_traslados,
  costo: costo,
  isBlock: isBlock
})

module.exports = { crearProducto, actualizarProducto }
