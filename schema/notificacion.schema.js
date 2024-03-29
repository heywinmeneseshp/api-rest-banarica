const Joi = require('joi');

const consecutivo = Joi.string();
const almacen_emisor = Joi.string();
const almacen_receptor = Joi.string();
const cons_movimiento = Joi.string();
const tipo_movimiento = Joi.string();
const descripcion = Joi.string();
const aprobado = Joi.boolean();
const visto = Joi.boolean();

const crearNotificacion = Joi.object({
  consecutivo: consecutivo,
  almacen_emisor: almacen_emisor,
  almacen_receptor: almacen_receptor,
  cons_movimiento: cons_movimiento.required(),
  tipo_movimiento: tipo_movimiento.required(),
  descripcion: descripcion.required(),
  aprobado: aprobado.required(),
  visto: visto.required(),
});

const actualizarNotificacion = Joi.object({
  consecutivo: consecutivo,
  almacen_emisor: almacen_emisor,
  almacen_receptor: almacen_receptor,
  cons_movimiento: cons_movimiento,
  tipo_movimiento: tipo_movimiento,
  descripcion: descripcion,
  aprobado: aprobado,
  visto: visto,
});

const filtrarPorAlamcen = Joi.object({
  almacen_emisor: almacen_emisor,
  almacen_receptor: almacen_receptor,
  cons_movimiento: cons_movimiento,
  tipo_movimiento: tipo_movimiento,
  descripcion: descripcion,
  aprobado: aprobado,
  visto: visto,
});


module.exports = { crearNotificacion, actualizarNotificacion, filtrarPorAlamcen };
