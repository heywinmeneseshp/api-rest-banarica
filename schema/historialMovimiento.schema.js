const Joi = require('joi');

const id = Joi.string().min(4);
const id_producto = Joi.string().min(4);
const id_almacen_gestor = Joi.string().min(3);
const id_almacen_receptor = Joi.any();
const id_lista_movimientos = Joi.string().min(2);
const tipo_movimiento = Joi.string();
const razon_movimiento = Joi.string();
const cantidad = Joi.number();
const id_pedido = Joi.any();

const crearHistorialMovimiento = Joi.object({
  id_producto: id_producto.required(),
  id_almacen_gestor: id_almacen_gestor.required(),
  id_almacen_receptor: id_almacen_receptor,
  id_lista_movimientos: id_lista_movimientos.required(),
  tipo_movimiento: tipo_movimiento.required(),
  razon_movimiento: razon_movimiento,
  cantidad: cantidad.required(),
  id_pedido: id_pedido,
});

const actualizarHistorialMovimiento = Joi.object({
  id: id,
  id_producto: id_producto,
  id_almacen_gestor: id_almacen_gestor,
  id_almacen_receptor: id_almacen_receptor,
  id_lista_movimientos: id_lista_movimientos,
  tipo_movimiento: tipo_movimiento,
  razon_movimiento: razon_movimiento,
  cantidad: cantidad,
  id_pedido: id_pedido,
});

module.exports = { crearHistorialMovimiento, actualizarHistorialMovimiento };
