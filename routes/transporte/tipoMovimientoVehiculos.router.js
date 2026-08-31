const express = require('express');

const itemService = require('../../services/transporte/tipoMovimientoVehiculos.service');

const router = express.Router();
const service = new itemService();

/**
 * @swagger
 * /tipoMovimientoVehiculos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [TipoMovimientoVehiculos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await service.find();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tipoMovimientoVehiculos/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [TipoMovimientoVehiculos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/paginar', async (req, res, next) => {
  try {
    const { page, limit, item } = req.query;
    const items = await service.paginate(page, limit, item);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tipoMovimientoVehiculos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [TipoMovimientoVehiculos]
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
  try {
    const { id } = req.params;
    const result = await service.findOne(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tipoMovimientoVehiculos:
 *   post:
 *     summary: Crea un registro
 *     tags: [TipoMovimientoVehiculos]
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
    const itemNuevo = await service.create(body);
    res.json({
      message: 'item creado',
      data: itemNuevo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tipoMovimientoVehiculos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [TipoMovimientoVehiculos]
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
    await service.update(id, body);
    res.json({
      message: 'item actualizado',
      data: body,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tipoMovimientoVehiculos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [TipoMovimientoVehiculos]
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
  try {
    const { id } = req.params;
    const result = await service.delete(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
