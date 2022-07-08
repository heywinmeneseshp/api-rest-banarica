const Joi = require('joi');

const id = Joi.string().min(4);
const prestador = Joi.string().min(3);
const deudor = Joi.string().min(3);
const id_producto = Joi.string();
const cantidad = Joi.number();

const crearDeuda = Joi.object({
  id: id,
  prestador: prestador.required(),
  deudor: deudor.required(),
  id_producto: id_producto.required(),
  cantidad: cantidad.required(),
});

const actualizarDeuda = Joi.object({
  cantidad: cantidad
});

module.exports = { crearDeuda, actualizarDeuda };
