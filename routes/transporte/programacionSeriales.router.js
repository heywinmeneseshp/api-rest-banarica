const express = require('express');
const passport = require('passport');
const ProgramacionSerialesService = require('../../services/transporte/programacionSeriales.service');

const router = express.Router();
const service = new ProgramacionSerialesService();

/**
 * @swagger
 * /programacion-seriales:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Programacion-seriales]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await service.findAll(req.query || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-seriales/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Programacion-seriales]
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
    const { page, limit } = req.query;
    const result = await service.paginate(page, limit, req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-seriales/masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Programacion-seriales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/masivo',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const result = await service.bulkCreate(req.body, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-seriales/vincular-contenedores:
 *   post:
 *     summary: POST /vincular-contenedores
 *     tags: [Programacion-seriales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/vincular-contenedores',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const result = await service.vincularContenedores(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-seriales:
 *   post:
 *     summary: Crea un registro
 *     tags: [Programacion-seriales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const result = await service.create(req.body, req.user);
    res.json({
      message: 'Relacion programacion-serial creada',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-seriales/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Programacion-seriales]
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
router.patch('/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.update(id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-seriales/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Programacion-seriales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.delete(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
