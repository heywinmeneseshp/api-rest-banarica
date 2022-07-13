const Joi = require('joi');

const consecutivo = Joi.string().min(4);
const prestador = Joi.string().min(3);
const deudor = Joi.string().min(3);
const cons_producto = Joi.string();
const cantidad = Joi.number();

const crearDeuda = Joi.object({
  consecutivo: consecutivo,
  prestador: prestador.required(),
  deudor: deudor.required(),
  cons_producto: cons_producto.required(),
  cantidad: cantidad.required(),
});

const actualizarDeuda = Joi.object({
  cantidad: cantidad
});

module.exports = { crearDeuda, actualizarDeuda };
