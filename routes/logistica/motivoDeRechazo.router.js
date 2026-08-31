const express = require('express');
const MotivoDeRechazoService = require('../../services/logistica/motivoDeRechazo.service.js');

const router = express.Router();
const service = new MotivoDeRechazoService();

// Obtener todos los motivos de rechazo
/**
 * @swagger
 * /motivoDeRechazo:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [MotivoDeRechazo]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res, next) => {
  try {
    const motivos = await service.find();
    res.json(motivos);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /motivoDeRechazo/masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [MotivoDeRechazo]
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
    const dataList = req.body;
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return res.status(400).json({ message: 'El formato de los datos es incorrecto o está vacío.' });
    }
    const nuevosMotivos = await service.bulkCreate(dataList);
    res.status(201).json({
      message: 'Carga masiva exitosa',
      total: nuevosMotivos.count,
      data: nuevosMotivos
    });
  } catch (error) {
    next(error);
  }
});

// Paginar motivos de rechazo
// Ejemplo: http://localhost:3000/api/v1/motivos-de-rechazo/paginar?offset=1&limit=4&motivo_rechazo=motivo1
/**
 * @swagger
 * /motivoDeRechazo/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [MotivoDeRechazo]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, motivo_rechazo } = req.query;
    const items = await service.paginate(offset, limit, motivo_rechazo);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un motivo de rechazo por ID
/**
 * @swagger
 * /motivoDeRechazo/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [MotivoDeRechazo]
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
    const motivoDeRechazo = await service.findOne(id);
    res.json(motivoDeRechazo);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo motivo de rechazo
/**
 * @swagger
 * /motivoDeRechazo:
 *   post:
 *     summary: Crea un registro
 *     tags: [MotivoDeRechazo]
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
    const motivoDeRechazoNuevo = await service.create(body);
    res.json({
      message: 'Motivo de rechazo creado',
      data: motivoDeRechazoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un motivo de rechazo
/**
 * @swagger
 * /motivoDeRechazo/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [MotivoDeRechazo]
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
    const motivoDeRechazo = await service.update(id, body);
    res.json(motivoDeRechazo);
  } catch (error) {
    next(error);
  }
});

// Eliminar un motivo de rechazo
/**
 * @swagger
 * /motivoDeRechazo/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [MotivoDeRechazo]
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
