const express = require('express');
const passport = require('passport');

const authRouter = require('./auth.router');
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
const etiquetasRouter = require('./administrador/etiquetas.router');

const recepcionRouter = require("./recepcion.router.js");
const pedidosRouter = require("./pedidos.router.js");
const trasladosRouter = require("./traslados.router.js");
const movimientosRouter = require("./movimientos.router.js");

const historialMovimientosRouter = require("./historialMovimientos.router.js");
const deudasRouter = require("./deudas.router.js");
const stock = require("./stock.router.js");

const semanasRouter = require("./administrador/semanas.router.js");
const documentosRouter = require("./documentos.router")

const seguridadRouter = require('./seguridad/seguridad.router');
const confiRouter = require('./configuracion.router');
//TRANSPORTE
const categoriaVehiculosRouter = require('./transporte/categoriaVehiculos.router.js');
const clientesRouter = require('./transporte/clientes.router.js');
const galonesPorRutaRouter = require('./transporte/galonesPorRuta.router.js');
const itinerariosRouter = require('./transporte/itinerarios.router.js');
const programacionesRouter = require('./transporte/programaciones.router.js');
const rutasRouter = require('./transporte/rutas.router.js');
const ubicacionesRouter = require('./transporte/ubicaciones.router.js');
const vehiculosRouter = require('./transporte/vehiculos.router.js');


function routerApi(app) {
  const router = express.Router();
  app.use('/api/v1', router);
  router.use('/auth', authRouter);
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
  router.use('/etiquetas', etiquetasRouter);

  router.use('/recepcion', recepcionRouter);
  router.use('/pedidos', pedidosRouter);
  router.use('/traslados', trasladosRouter);
  router.use('/movimientos', movimientosRouter);

  router.use('/historial-movimientos', historialMovimientosRouter);
  router.use('/deudas', deudasRouter);
  router.use('/stock', stock);

  router.use('/semanas', semanasRouter);
  router.use('/documentos', documentosRouter);

  router.use('/seguridad', seguridadRouter);
  router.use('/confi', confiRouter);
  //TRANSPORTE
  router.use('/categoriaVehiculos', categoriaVehiculosRouter);
  router.use('/clientes', clientesRouter);
  router.use('/galonesPorRuta', galonesPorRutaRouter);
  router.use('/itinerarios', itinerariosRouter);
  router.use('/programaciones', programacionesRouter);
  router.use('/rutas', rutasRouter);
  router.use('/ubicaciones', ubicacionesRouter);
  router.use('/vehiculos', vehiculosRouter);

}

module.exports = routerApi;
