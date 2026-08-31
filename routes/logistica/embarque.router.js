const express = require('express');
const EmbarqueService = require('../../services/logistica/embarque.service.js');

const router = express.Router();
const service = new EmbarqueService();

// Catálogo liviano para dropdowns y datalists (solo campos esenciales)
/**
 * @swagger
 * /embarque/catalogo:
 *   get:
 *     summary: GET /catalogo
 *     tags: [Embarque]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/catalogo', async (req, res, next) => {
  try {
    const items = await service.getCatalogo();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener todos los embarques
/**
 * @swagger
 * /embarque:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Embarque]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res, next) => {
  try {
    const embarques = await service.find();
    res.json(embarques);
  } catch (error) {
    next(error);
  }
});

// Paginar embarques
// Ejemplo: http://localhost:3000/api/v1/embarques/paginar?offset=1&limit=4&filters={"nombre":"embarque1"}
/**
 * @swagger
 * /embarque/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Embarque]
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
    const { offset, limit} = req.query;
    const body = req.body || {};
    const items = await service.paginate(offset, limit, body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un embarque por ID
/**
 * @swagger
 * /embarque/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Embarque]
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
    const embarque = await service.findOne(id);
    res.json(embarque);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo embarque
/**
 * @swagger
 * /embarque:
 *   post:
 *     summary: Crea un registro
 *     tags: [Embarque]
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
    const embarqueNuevo = await service.create(body);
    res.json({
      message: 'Embarque creado',
      data: embarqueNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Crear embarques masivos
/**
 * @swagger
 * /embarque/masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Embarque]
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
    const embarqueNuevo = await service.cargueMasivo(body);
    res.json({
      message: 'Embarques creados',
      data: embarqueNuevo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /embarque/actualizar-masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Embarque]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/actualizar-masivo', async (req, res, next) => {
  try {
    const body = req.body;
    const embarqueNuevo = await service.actualizarMasivo(body);
    res.json({
      message: 'Embarques creados',
      data: embarqueNuevo
    });
  } catch (error) {
    next(error);
  }
});


// Actualizar un embarque
/**
 * @swagger
 * /embarque/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Embarque]
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
    const embarque = await service.update(id, body);
    res.json(embarque);
  } catch (error) {
    next(error);
  }
});

// Eliminar un embarque
/**
 * @swagger
 * /embarque/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Embarque]
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

// Exporte plano para Excel
/**
 * @swagger
 * /embarque/exportar:
 *   post:
 *     summary: POST /exportar
 *     tags: [Embarque]
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
