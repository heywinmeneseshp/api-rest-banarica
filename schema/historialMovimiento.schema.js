const Joi = require('joi');

const cons_movimiento = Joi.string().min(4);
const cons_producto = Joi.string().min(4);
const cons_almacen_gestor = Joi.string().min(3);
const cons_almacen_receptor = Joi.any();
const cons_lista_movimientos = Joi.string().min(2);
const tipo_movimiento = Joi.string();
const razon_movimiento = Joi.string();
const cantidad = Joi.number();
const cons_pedido = Joi.any();

const crearHistorialMovimiento = Joi.object({
  cons_movimiento: cons_movimiento,
  cons_producto: cons_producto.required(),
  cons_almacen_gestor: cons_almacen_gestor.required(),
  cons_almacen_receptor: cons_almacen_receptor,
  cons_lista_movimientos: cons_lista_movimientos.required(),
  tipo_movimiento: tipo_movimiento.required(),
  razon_movimiento: razon_movimiento,
  cantidad: cantidad.required(),
  cons_pedido: cons_pedido,
});

const actualizarHistorialMovimiento = Joi.object({
  cons_movimiento: cons_movimiento,
  cons_producto: cons_producto,
  cons_almacen_gestor: cons_almacen_gestor,
  cons_almacen_receptor: cons_almacen_receptor,
  cons_lista_movimientos: cons_lista_movimientos,
  tipo_movimiento: tipo_movimiento,
  razon_movimiento: razon_movimiento,
  cantidad: cantidad,
  cons_pedido: cons_pedido,
});

module.exports = { crearHistorialMovimiento, actualizarHistorialMovimiento };
