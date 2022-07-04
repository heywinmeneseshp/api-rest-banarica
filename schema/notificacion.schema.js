const Joi = require('joi');

const id = Joi.string().min(4);
const id_almacen = Joi.string().min(4);
const id_movimiento = Joi.string().min(4);
const aprovado = Joi.boolean();
const visto = Joi.boolean();

const crearNotificacion = Joi.object({
  id: id,
  id_almacen: id_almacen.required(),
  id_movimiento: id_movimiento.required(),
  aprovado: aprovado.required(),
  visto: visto.required(),
});

const actualizarNotificacion = Joi.object({
  id: id,
  id_almacen: id_almacen,
  id_movimiento: id_movimiento,
  aprovado: aprovado,
  visto: visto,
});

module.exports = { crearNotificacion, actualizarNotificacion };
