const express = require('express');
const DestinoService = require('../../services/logistica/destino.service.js');

const router = express.Router();
const service = new DestinoService();

// Obtener todos los destinos
/**
 * @swagger
 * /destino:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Destino]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res, next) => {
  try {
    const destinos = await service.find();
    res.json(destinos);
  } catch (error) {
    next(error);
  }
});

// Paginar destinos
// Ejemplo: http://localhost:3000/api/v1/destinos/paginar?offset=1&limit=4&destino=destino1
/**
 * @swagger
 * /destino/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Destino]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, destino } = req.query;
    const items = await service.paginate(offset, limit, destino);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un destino por ID
/**
 * @swagger
 * /destino/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Destino]
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
    const destino = await service.findOne(id);
    res.json(destino);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo destino
/**
 * @swagger
 * /destino:
 *   post:
 *     summary: Crea un registro
 *     tags: [Destino]
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
    const destinoNuevo = await service.create(body);
    res.json({
      message: 'Destino creado',
      data: destinoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo destino
/**
 * @swagger
 * /destino/masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Destino]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/masivo', async (req, res, next) => {
  try {
    const body = req.body;
    const nuevosDestinos = await service.bulkCreate(body);
    res.json({
      message: 'Destino creado',
      data: nuevosDestinos
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un destino
/**
 * @swagger
 * /destino/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Destino]
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
    const destino = await service.update(id, body);
    res.json(destino);
  } catch (error) {
    next(error);
  }
});

// Eliminar un destino
/**
 * @swagger
 * /destino/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Destino]
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
