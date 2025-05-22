const Joi = require('joi');

// Reutilizables
const texto = Joi.string().min(1).max(100);
const numeroEntero = Joi.number().integer().min(0);
const numeroDecimal = Joi.number().precision(2).min(0);

// Esquema común (usado en ambos)
const esquemaCombo = {
  id: texto,
  consecutivo: texto,
  nombre: texto,
  isBlock: Joi.boolean(),
  id_cliente: texto,
  cajas_por_palet: numeroEntero,
  cajas_por_mini_palet: numeroEntero,
  palets_por_contenedor: numeroEntero,
  peso_neto: numeroDecimal,
  peso_bruto: numeroDecimal,
  precio_de_venta: numeroDecimal,
  createdAt: Joi.date()
};

// ✅ Crear combo: todos los campos requeridos
const crearCombo = Joi.object({
  ...esquemaCombo,
  id: esquemaCombo.id.required(),
  consecutivo: esquemaCombo.consecutivo.required(),
  nombre: esquemaCombo.nombre.required(),
  isBlock: esquemaCombo.isBlock.required(),
  id_cliente: esquemaCombo.id_cliente.required(),
  cajas_por_palet: esquemaCombo.cajas_por_palet.required(),
  precio_de_venta: esquemaCombo.precio_de_venta.required(),
});

// ✅ Actualizar combo: todos los campos opcionales
const actualizarCombo = Joi.object(esquemaCombo);

// ✅ Armar combo
const armarCombo = Joi.object({
  cons_combo: texto.required(),
  cons_producto: texto.required(),
});

module.exports = {
  crearCombo,
  actualizarCombo,
  armarCombo
};
