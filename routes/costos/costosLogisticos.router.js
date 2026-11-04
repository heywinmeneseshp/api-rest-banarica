const express = require('express');
const passport = require('passport');
const boom = require('@hapi/boom');

const db = require('../../models');
const CostosLogisticosService = require('../../services/costos/costosLogisticos.service');
const { ROLES } = require('../../middlewares/auth.handler');

const router = express.Router();
const service = new CostosLogisticosService();

// Acceso por permiso de menu: el Super administrador entra siempre; los demas
// necesitan "costos" en el menu configurado para su usuario (el mismo dato que
// usa el menu de la app para mostrar u ocultar el modulo).
async function checkAccesoCostos(req, _res, next) {
  try {
    if (req.user?.id_rol === ROLES.SUPER_ADMIN) return next();
    const config = await db.configuracion.findOne({ where: { modulo: req.user?.username }, attributes: ['detalles'] });
    let menu = [];
    try {
      menu = JSON.parse(config?.detalles || '{}').menu || [];
    } catch {
      menu = [];
    }
    if (!menu.includes('costos')) {
      return next(boom.forbidden('No tiene acceso al modulo de Costos logisticos'));
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

router.use(passport.authenticate('jwt', { session: false }), checkAccesoCostos);

const ruta = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (error) {
    next(error);
  }
};

// ── Estados de factura ──
router.get('/estados-factura', ruta(async (req, res) => res.json(await service.listarEstados())));
router.post('/estados-factura', ruta(async (req, res) => { await service.guardarEstado(req.body); res.json({ ok: true }); }));
router.delete('/estados-factura', ruta(async (req, res) => { await service.eliminarEstado(Number(req.query.id)); res.json({ ok: true }); }));

// ── Tipos de documento ──
router.get('/tipos-documento', ruta(async (req, res) => res.json(await service.listarTiposDocumento())));
router.post('/tipos-documento', ruta(async (req, res) => { await service.guardarTipoDocumento(req.body); res.json({ ok: true }); }));
router.delete('/tipos-documento', ruta(async (req, res) => { await service.eliminarTipoDocumento(Number(req.query.id)); res.json({ ok: true }); }));

// ── Tipos de costo ──
router.get('/tipos-costo', ruta(async (req, res) => res.json(await service.listarTiposCosto(req.query.q))));
router.post('/tipos-costo', ruta(async (req, res) => { await service.guardarTipoCosto(req.body); res.json({ ok: true }); }));
router.delete('/tipos-costo', ruta(async (req, res) => { await service.eliminarTipoCosto(req.body?.id); res.json({ ok: true }); }));

// ── Catalogo de items (conceptos) ──
router.get('/items-catalog', ruta(async (req, res) => res.json(await service.listarItems(req.query.q || ''))));
router.post('/items-catalog', ruta(async (req, res) => {
  if (req.body?._check) return res.json({ unknown: await service.validarConceptos(req.body.names || []) });
  if (Array.isArray(req.body)) return res.json(await service.cargarItems(req.body));
  await service.guardarItem(req.body);
  return res.json({ ok: true });
}));
router.delete('/items-catalog', ruta(async (req, res) => { await service.eliminarItem(req.body?.id); res.json({ ok: true }); }));

// ── Proveedores ──
router.get('/proveedores-local', ruta(async (req, res) => res.json(await service.listarProveedores())));
router.post('/proveedores-local', ruta(async (req, res) => {
  if (req.body?._check) return res.json({ unknown: await service.validarNits(req.body.nits || []) });
  if (Array.isArray(req.body)) return res.json(await service.cargarProveedores(req.body));
  await service.guardarProveedor(req.body);
  return res.json({ ok: true });
}));
router.delete('/proveedores-local', ruta(async (req, res) => {
  if (!req.body?.nit) throw boom.badRequest('nit requerido');
  await service.eliminarProveedor(req.body.nit);
  res.json({ ok: true });
}));

// ── TRM ──
router.get('/trm', ruta(async (req, res) => {
  if (req.query.fecha) return res.json({ valor: await service.trmParaFecha(req.query.fecha) });
  return res.json(await service.listarTrm());
}));
router.post('/trm/sincronizar-diaria', ruta(async (req, res) => res.json(await service.sincronizarTrmDiaria())));
router.post('/trm/sincronizar', ruta(async (req, res) => res.json(await service.sincronizarTrmBanrep({ desde: req.body?.desde, hasta: req.body?.hasta }))));
router.delete('/trm', ruta(async (req, res) => { await service.borrarTrm(); res.json({ ok: true }); }));
router.post('/trm-bulk', ruta(async (req, res) => {
  if (!Array.isArray(req.body)) throw boom.badRequest('Se esperaba un array');
  const filas = req.body
    .map((r) => ({ fecha: String(r.fecha || '').trim(), valor: parseFloat(String(r.valor).replace(',', '.')) }))
    .filter((r) => r.fecha && !Number.isNaN(r.valor));
  res.json({ ok: true, inserted: await service.cargarTrm(filas) });
}));

// ── Facturas ──
router.get('/facturas', ruta(async (req, res) => res.json(await service.listarFacturas(req.query))));
router.post('/facturas', async (req, res) => {
  try {
    res.json({ ok: true, id: await service.crearFactura(req.body) });
  } catch (error) {
    res.status(error.output?.statusCode || 400).json({ ok: false, error: error.output?.payload?.message || error.message });
  }
});
router.patch('/facturas', async (req, res) => {
  const { id, _estadoOnly: soloEstado, estado, ...data } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id requerido' });
  try {
    if (soloEstado) await service.cambiarEstadoFactura(id, estado);
    else await service.actualizarFactura(id, { estado, ...data });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(error.output?.statusCode || 400).json({ ok: false, error: error.output?.payload?.message || error.message });
  }
});
router.delete('/facturas', ruta(async (req, res) => {
  if (!req.body?.id) throw boom.badRequest('id requerido');
  await service.eliminarFactura(req.body.id);
  res.json({ ok: true });
}));
router.delete('/facturas-clear', ruta(async (req, res) => res.json({ ok: true, total: await service.eliminarTodasFacturas() })));
router.post('/facturas-bulk', ruta(async (req, res) => res.json(await service.cargarFacturas(req.body))));

// ── Consultas sobre la operacion (semanas, meses, contenedores, bookings) ──
router.get('/semanas', ruta(async (req, res) => res.json(await service.buscarSemanas(req.query.q || ''))));
router.get('/meses', ruta(async (req, res) => res.json(service.buscarMeses(req.query.q || ''))));
router.get('/anhos', ruta(async (req, res) => res.json(await service.listarAnhos(req.query.q))));
router.get('/contenedores-cache', ruta(async (req, res) => res.json(await service.buscarContenedores(req.query.q || ''))));
router.post('/contenedores-cache', ruta(async (req, res) => {
  if (!Array.isArray(req.body)) throw boom.badRequest('Se esperaba un array');
  res.json({ mismatches: await service.validarContenedores(req.body) });
}));
router.get('/bookings-cache', ruta(async (req, res) => res.json(await service.buscarBookings(req.query.q || ''))));

module.exports = router;
