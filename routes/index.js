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
const recordConsumoRouter = require('./transporte/record_consumo.router.js');
const programacionesRouter = require('./transporte/programaciones.router.js');
const rutasRouter = require('./transporte/rutas.router.js');
const ubicacionesRouter = require('./transporte/ubicaciones.router.js');
const vehiculosRouter = require('./transporte/vehiculos.router.js');
const productosViajesRouter = require('./transporte/productos-viaje.router.js');
const tanqueoRouter = require('./transporte/tanqueos.router.js');
//LOGISTICA
const buqueRouter = require('./logistica/buque.router.js');
const caidaRouter = require('./logistica/caida.router.js');
const contenedorRouter = require('./logistica/contenedor.router.js');
const destinoRouter = require('./logistica/destino.router.js');
const embarqueRouter = require('./logistica/embarque.router.js');
const inspeccionRouter = require('./logistica/inspeccion.router.js');
const listadoRouter = require('./logistica/listado.router.js');
const motivoDeRechazoRouter = require('./logistica/motivoDeRechazo.router.js');
const navieraRouter = require('./logistica/naviera.router.js');
const rechazoRouter = require('./logistica/rechazo.router.js');
const saeRouter = require('./logistica/sae.router.js');
const transbordoRouter = require('./logistica/transbordo.router.js');

const emailRouter = require('./email.router.js')
//CONFIGURACION
const empresaRouter = require('./configuracion/empresa.router.js');


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

  
  //TRANSPORTE
  router.use('/categoriaVehiculos', categoriaVehiculosRouter);
  router.use('/clientes', clientesRouter);
  router.use('/galonesPorRuta', galonesPorRutaRouter);
  router.use('/record_consumo', recordConsumoRouter);
  router.use('/programaciones', programacionesRouter);
  router.use('/rutas', rutasRouter);
  router.use('/ubicaciones', ubicacionesRouter);
  router.use('/vehiculos', vehiculosRouter);
  router.use('/productos-viaje', productosViajesRouter);
  router.use('/tanqueo', tanqueoRouter);
  //LOGISTICA
  router.use('/buque', buqueRouter);
  router.use('/caida', caidaRouter);
  router.use('/contenedor', contenedorRouter);
  router.use('/destino', destinoRouter);
  router.use('/embarque', embarqueRouter);
  router.use('/inspeccion', inspeccionRouter);
  router.use('/listado', listadoRouter);
  router.use('/motivoDeRechazo', motivoDeRechazoRouter);
  router.use('/naviera', navieraRouter);
  router.use('/rechazo', rechazoRouter);
  router.use('/sae', saeRouter);
  router.use('/transbordo', transbordoRouter);

  router.use('/email', emailRouter);
  //CONFIGURACION
  router.use('/empresa', empresaRouter);
  router.use('/seguridad', seguridadRouter);
  router.use('/confi', confiRouter);

}

module.exports = routerApi;
