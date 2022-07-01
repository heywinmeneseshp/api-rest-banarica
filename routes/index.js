const express = require('express');

const productosRouter = require("./productos.router.js");
const usuariosRouter = require("./usuarios.router.js");
const combosRouter = require("./combos.router.js");
const categoriasRouter = require("./categorias.router.js");
const proveedoresRouter = require("./proveedores.router.js");
const bodegasRouter = require("./bodegas.router.js");
const transportadorasRouter = require("./transportadoras.router.js");
const conductoresRouter = require("./conductores.router.js");
const notificacionesRouter = require("./notificaciones.router.js");
const avisosRouter = require("./avisos.router.js");

const recepcionRouter = require("./recepcion.router.js");
const pedidosRouter = require("./pedidos.router.js");
const trasladosRouter = require("./traslados.router.js");
const movimientosRouter = require("./movimientos.router.js");

const historialMovimientosRouter = require("./historialMovimientos.router.js");
const deudasRouter = require("./deudas.router.js");

const semanasRouter = require("./semanas.router.js");

function routerApi(app) {
  const router = express.Router();
  app.use('/api/v1', router);
  router.use('/productos', productosRouter);
  router.use('/usuarios', usuariosRouter);
  router.use('/combos', combosRouter);
  router.use('/categorias', categoriasRouter);
  router.use('/proveedores', proveedoresRouter);
  router.use('/bodegas', bodegasRouter);
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

  router.use('/semanas', semanasRouter);
}

module.exports = routerApi;
