const db = require('../../models');

// Compartido por cualquier servicio que escriba directamente sobre Listado
// (ademas de listado.service.js: seguridad.service.js -InspeccionVacio-,
// rechazo.service.js y transbordo.service.js), para que el historial quede
// completo sin importar por donde entro el cambio.
async function registrarHistorialListado({ listado_id, accion, usuario, datosAnteriores, datosNuevos, contenedorCodigo }) {
  try {
    await db.listado_historial.create({
      listado_id,
      accion,
      usuario: usuario || null,
      contenedor: contenedorCodigo
        || datosNuevos?.Contenedor?.contenedor
        || datosAnteriores?.Contenedor?.contenedor
        || null,
      datos_anteriores: datosAnteriores || null,
      datos_nuevos: datosNuevos || null,
    });
  } catch (error) {
    // No se debe romper la operacion principal si falla el registro de historial.
    console.error('No se pudo registrar el historial de listado:', error?.message);
  }
}

module.exports = { registrarHistorialListado };
