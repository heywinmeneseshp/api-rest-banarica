const express = require('express');
const TransbordoService = require('../../services/logistica/transbordo.service.js');

const router = express.Router();
const service = new TransbordoService();

// Obtener todos los transbordos
/**
 * @swagger
 * /transbordo:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Transbordo]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res, next) => {
  try {
    const transbordos = await service.find();
    res.json(transbordos);
  } catch (error) {
    next(error);
  }
});

// Paginar transbordos
// Ejemplo: http://localhost:3000/api/v1/transbordos/paginar?offset=1&limit=4&id_contenedor_viejo=contenedor1&id_contenedor_nuevo=contenedor2
/**
 * @swagger
 * /transbordo/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Transbordo]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, contenedor_viejo, contenedor_nuevo, fecha_inicial, fecha_final } = req.query;
    const items = await service.paginate(
      offset,
      limit,
      contenedor_viejo,
      contenedor_nuevo,
      fecha_inicial,
      fecha_final
    );
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un transbordo por ID
/**
 * @swagger
 * /transbordo/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Transbordo]
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
    const transbordo = await service.findOne(id);
    res.json(transbordo);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo transbordo
/**
 * @swagger
 * /transbordo:
 *   post:
 *     summary: Crea un registro
 *     tags: [Transbordo]
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
    const transbordoNuevo = await service.create(body);
    res.json({
      message: 'Transbordo creado',
      data: transbordoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un transbordo
/**
 * @swagger
 * /transbordo/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Transbordo]
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
    const transbordo = await service.update(id, body);
    res.json(transbordo);
  } catch (error) {
    next(error);
  }
});

// Eliminar un transbordo
/**
 * @swagger
 * /transbordo/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Transbordo]
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
