const express = require('express');

const productosRouter = require("./administrador/productos.router.js");
const usuariosRouter = require("./administrador/usuarios.router.js");
const combosRouter = require("./administrador/combos.router.js");
const categoriasRouter = require("./administrador/categorias.router.js");
const proveedoresRouter = require("./administrador/proveedores.router.js");
const almacenesRouter = require("./administrador/almacenes.router.js");
const transportadorasRouter = require("./administrador/transportadoras.router");
const conductoresRouter = require("./administrador/conductores.router.js");
const notificacionesRouter = require("./administrador/notificaciones.router");
const avisosRouter = require("./administrador/avisos.router.js");

const recepcionRouter = require("./recepcion.router.js");
const pedidosRouter = require("./pedidos.router.js");
const trasladosRouter = require("./traslados.router.js");
const movimientosRouter = require("./movimientos.router.js");

const historialMovimientosRouter = require("./historialMovimientos.router.js");
const deudasRouter = require("./deudas.router.js");
const stock = require("./stock.router.js");

const semanasRouter = require("./administrador/semanas.router.js");

function routerApi(app) {
  const router = express.Router();
  app.use('/api/v1', router);
  router.use('/productos', productosRouter);
  router.use('/usuarios', usuariosRouter);
  router.use('/combos', combosRouter);
  router.use('/categorias', categoriasRouter);
  router.use('/proveedores', proveedoresRouter);
  router.use('/almacenes', almacenesRouter);
  router.use('/transportadoras', transportadorasRouter);
  router.use('/conductores', conductoresRouter);
  router.use('/notificaciones', notificacionesRouter);
  router.use('/avisos', avisosRouter);

  router.use('/recepcion', recepcionRouter);
  router.use('/pedidos', pedidosRouter);
  router.use('/traslados', trasladosRouter);
  router.use('/movimientos', movimientosRouter);

  router.use('/historial-movimientos', historialMovimientosRouter);
  router.use('/deudas', deudasRouter);
  router.use('/stock', stock);

  router.use('/semanas', semanasRouter);
}

module.exports = routerApi;
