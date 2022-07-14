const Joi = require('joi');

const cons_pedido = Joi.string().min(4);
const cons_producto = Joi.string().min(4);
const cons_almacen_destino = Joi.string().min(3);
const cantidad = Joi.number();


const consecutivo = Joi.string();
const pendiente = Joi.boolean();
const observaciones = Joi.string();
const cons_semana = Joi.string();
const fecha = Joi.string();
const usuario = Joi.string();

const crearPedido = Joi.object({
  cons_pedido: cons_pedido.required(),
  cons_producto: cons_producto.required(),
  cons_almacen_destino: cons_almacen_destino.required(),
  cantidad: cantidad.required()
});

const editarPedido = Joi.object({
  cons_producto: cons_producto,
  cons_almacen_destino: cons_almacen_destino,
  cantidad: cantidad
});

const ingresarConsPedido = Joi.object({
  consecutivo: consecutivo,
  pendiente: pendiente.required(),
  observaciones: observaciones.required(),
  fecha: fecha.required(),
  cons_semana: cons_semana.required(),
  usuario: usuario.required()
})

const recibirPedido = Joi.object({
  consecutivo: consecutivo,
  observaciones: observaciones,
  pendiente: pendiente,
})

module.exports = { crearPedido, editarPedido, ingresarConsPedido, recibirPedido };
