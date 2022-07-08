const Joi = require('joi');

const id_pedido = Joi.string().min(4);
const id_producto = Joi.string().min(4);
const id_almacen_destino = Joi.string().min(3);
const cantidad = Joi.number();


const id = Joi.string();
const pendiente = Joi.boolean();
const observaciones = Joi.string();
const semana = Joi.string();
const fecha = Joi.string();
const usuario = Joi.string();

const crearPedido = Joi.object({
  id_pedido: id_pedido.required(),
  id_producto: id_producto.required(),
  id_almacen_destino: id_almacen_destino.required(),
  cantidad: cantidad.required()
});

const editarPedido = Joi.object({
  id_producto: id_producto,
  id_almacen_destino: id_almacen_destino,
  cantidad: cantidad
});

const ingresarConsPedido = Joi.object({
  id: id,
  pendiente: pendiente.required(),
  observaciones: observaciones.required(),
  fecha: fecha.required(),
  semana: semana.required(),
  usuario: usuario.required()
})

const recibirPedido = Joi.object({
  id: id,
  pendiente: pendiente.required(),
})

module.exports = { crearPedido, editarPedido, ingresarConsPedido, recibirPedido };
