const express = require('express');
const passport = require('passport');
const RechazoService = require('../../services/logistica/rechazo.service.js');

const router = express.Router();
const service = new RechazoService();

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.id_rol !== 'Super administrador') {
    return res.status(403).json({ message: 'Solo un Super administrador puede eliminar o restaurar rechazos.' });
  }
  next();
};

// Obtener todos los rechazos
router.get('/', async (req, res, next) => {
  try {
    const rechazos = await service.find();
    res.json(rechazos);
  } catch (error) {
    next(error);
  }
});

// Paginar rechazos
// Ejemplo: http://localhost:3000/api/v1/rechazos/paginar?offset=1&limit=4&id_producto=123
router.post('/paginar', async (req, res, next) => {
  try {
    const { offset, limit } = req.query;
    const body = req.body;
    const items = await service.paginate(offset, limit, body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un rechazo por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const rechazo = await service.findOne(id);
    res.json(rechazo);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo rechazo
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const rechazoNuevo = await service.create(body);
    res.json({
      message: 'Rechazo creado',
      data: rechazoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un rechazo
router.patch('/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const rechazo = await service.update(id, body, req.user?.username);
    res.json(rechazo);
  } catch (error) {
    next(error);
  }
});

// Aprobar un rechazo (transacción con SELECT FOR UPDATE)
router.post('/:id/aprobar', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.aprobar(id, req.body, req.user?.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Eliminar un rechazo (solo Super administrador; si ya estaba aprobado, devuelve
// las cajas descontadas al inventario)
router.delete('/:id', passport.authenticate('jwt', { session: false }), requireSuperAdmin, async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.delete(id, req.user?.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Restaurar un rechazo eliminado (solo Super administrador; si estaba aprobado
// al eliminarse, vuelve a descontar el inventario)
router.post('/:id/restaurar', passport.authenticate('jwt', { session: false }), requireSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.restaurar(id, req.user?.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Exporte plano para Excel
router.post('/exportar', async (req, res, next) => {
  try {
    const { offset, limit } = req.query;
    const body = req.body;
    const items = await service.exportExcel(offset, limit, body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
