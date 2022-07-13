const Joi = require('joi');

const consecutivo = Joi.string().min(4);
const cons_almacen = Joi.string().min(4);
const cons_movimiento = Joi.string().min(4);
const aprobado = Joi.boolean();
const visto = Joi.boolean();

const crearNotificacion = Joi.object({
  consecutivo: consecutivo,
  cons_almacen: cons_almacen.required(),
  cons_movimiento: cons_movimiento.required(),
  aprobado: aprobado.required(),
  visto: visto.required(),
});

const actualizarNotificacion = Joi.object({
  consecutivo: consecutivo,
  cons_almacen: cons_almacen,
  cons_movimiento: cons_movimiento,
  aprobado: aprobado,
  visto: visto,
});

module.exports = { crearNotificacion, actualizarNotificacion };
