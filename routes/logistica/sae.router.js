const express = require('express');
const SAEService = require('../../services/logistica/sae.service.js');

const router = express.Router();
const service = new SAEService();

// Obtener todas las SAEs
/**
 * @swagger
 * /sae:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Sae]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res, next) => {
  try {
    const saes = await service.find();
    res.json(saes);
  } catch (error) {
    next(error);
  }
});

// Paginar SAEs
// Ejemplo: http://localhost:3000/api/v1/saes/paginar?offset=1&limit=4&sae=SAE1
/**
 * @swagger
 * /sae/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Sae]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, sae } = req.query;
    const items = await service.paginate(offset, limit, sae);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener una SAE por ID
/**
 * @swagger
 * /sae/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Sae]
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
    const sae = await service.findOne(id);
    res.json(sae);
  } catch (error) {
    next(error);
  }
});

// Crear una nueva SAE
/**
 * @swagger
 * /sae:
 *   post:
 *     summary: Crea un registro
 *     tags: [Sae]
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
    const saeNuevo = await service.create(body);
    res.json({
      message: 'SAE creada',
      data: saeNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar una SAE
/**
 * @swagger
 * /sae/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Sae]
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
    const sae = await service.update(id, body);
    res.json(sae);
  } catch (error) {
    next(error);
  }
});

// Eliminar una SAE
/**
 * @swagger
 * /sae/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Sae]
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
