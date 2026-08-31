const express = require('express');
const db = require('../models');

const router = express.Router();

/**
 * @swagger
 * /carrusel/por-transportadora/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Carrusel]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/por-transportadora/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const items = await db.carrusel.findAll({
      where: { id_transportadora: id },
      include: [{ model: db.Contenedor, as: 'contenedor' }]
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /carrusel/por-contenedor/{contenedorId}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Carrusel]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: contenedorId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/por-contenedor/:contenedorId', async (req, res, next) => {
  try {
    const { contenedorId } = req.params;
    const item = await db.carrusel.findOne({
      where: { id_contenedor: contenedorId },
      include: [{ model: db.transportadoras, as: 'transportadora' }]
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
