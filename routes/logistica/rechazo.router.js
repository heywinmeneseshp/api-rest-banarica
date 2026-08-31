const express = require('express');
const passport = require('passport');
const { checkApiKeyOrJwt } = require('../../middlewares/auth.handler');
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
/**
 * @swagger
 * /rechazo:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Rechazo]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /rechazo/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Rechazo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /rechazo/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Rechazo]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /rechazo:
 *   post:
 *     summary: Crea un registro
 *     tags: [Rechazo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /rechazo/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Rechazo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /rechazo/{id}/aprobar:
 *   post:
 *     summary: POST /:id/aprobar
 *     tags: [Rechazo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /rechazo/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Rechazo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /rechazo/{id}/restaurar:
 *   post:
 *     summary: POST /:id/restaurar
 *     tags: [Rechazo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/:id/restaurar', passport.authenticate('jwt', { session: false }), requireSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.restaurar(id, req.user?.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Reenvía a Corbana los rechazos ya existentes de una semana (backfill) —
// sin esto, los rechazos creados antes de que existiera esta sincronización
// nunca llegan a Corbana. Acepta login de Super administrador (uso manual)
// O la API key servidor-a-servidor (llamado por Corbana cada vez que
// alguien le da "Sincronizar" a Programación de Corte de esa semana — ver
// programacionCorteService.syncFromBanarica en api-rest-corbana).
/**
 * @swagger
 * /rechazo/backfill:
 *   post:
 *     summary: POST /backfill
 *     tags: [Rechazo]
 *     description: Acepta login JWT o el header `api` con la API key.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/backfill', checkApiKeyOrJwt, async (req, res, next) => {
  try {
    if (req.user && req.user.id_rol !== 'Super administrador') {
      return res.status(403).json({ message: 'Solo un Super administrador puede reenviar rechazos.' });
    }
    const { semana } = req.body;
    if (!semana) return res.status(400).json({ message: 'Debes indicar la semana (ej. S33-2026)' });
    const result = await service.backfillSemana(semana);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Exporte plano para Excel
/**
 * @swagger
 * /rechazo/exportar:
 *   post:
 *     summary: POST /exportar
 *     tags: [Rechazo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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
