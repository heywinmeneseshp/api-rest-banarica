const express = require('express');
const InspeccionService = require('../../services/logistica/inspeccion.service.js');

const router = express.Router();
const service = new InspeccionService();

// Obtener todas las inspecciones
/**
 * @swagger
 * /inspeccion:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Inspeccion]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res, next) => {
  try {
    const inspecciones = await service.find();
    res.json(inspecciones);
  } catch (error) {
    next(error);
  }
});

// Paginar inspecciones
// Ejemplo: http://localhost:3000/api/v1/inspeccion/paginar?offset=1&limit=4&filters={"nombre":"inspeccion1"}
/**
 * @swagger
 * /inspeccion/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Inspeccion]
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
    const filterObject = req.body
    const items = await service.paginate(offset, limit, filterObject);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Estadisticas de inspeccionados vs exportados (por anio, destino, naviera, cliente o combinaciones)
// Ejemplo: /api/v1/inspeccion/estadisticas?groupBy=anio,destino&anio=2026
/**
 * @swagger
 * /inspeccion/estadisticas:
 *   get:
 *     summary: GET /estadisticas
 *     tags: [Inspeccion]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/estadisticas', async (req, res, next) => {
  try {
    const { groupBy, anio } = req.query;
    const dimensiones = groupBy ? String(groupBy).split(',').map((item) => item.trim()).filter(Boolean) : ['anio'];
    const data = await service.estadisticas({ groupBy: dimensiones, anio });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// Obtener una inspección por ID
/**
 * @swagger
 * /inspeccion/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Inspeccion]
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
    const inspeccion = await service.findOne(id);
    res.json(inspeccion);
  } catch (error) {
    next(error);
  }
});

// Crear una nueva inspección
/**
 * @swagger
 * /inspeccion:
 *   post:
 *     summary: Crea un registro
 *     tags: [Inspeccion]
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
    const inspeccionNueva = await service.create(body);
    res.json({
      message: 'Inspección creada',
      data: inspeccionNueva
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar una inspección
/**
 * @swagger
 * /inspeccion/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Inspeccion]
 *     security: []
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
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const inspeccion = await service.update(id, body);
    res.json(inspeccion);
  } catch (error) {
    next(error);
  }
});

// Eliminar una inspección
/**
 * @swagger
 * /inspeccion/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Inspeccion]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.delete(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
