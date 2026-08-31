const express = require("express");
const passport = require("passport");

const itemService = require("../../services/transporte/vehiculos.service");
const router = express.Router();
const service = new itemService();

/**
 * @swagger
 * /vehiculos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Vehiculos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const result = await service.find(req.user, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /vehiculos/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Vehiculos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get("/paginar", passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const { page, limit, item, transportadoraId, includeUnassigned } = req.query;
    const items = await service.paginate(page, limit, item, req.user, { transportadoraId, includeUnassigned });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /vehiculos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Vehiculos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/:id", async (req, res, next) => {
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
 * /vehiculos:
 *   post:
 *     summary: Crea un registro
 *     tags: [Vehiculos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/", async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.create(body);
    res.json({
      message: "item creado",
      data: itemNuevo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /vehiculos/masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Vehiculos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/masivo", async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.bulkCreate(body);
    res.json({
      message: "vehiculos creados",
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /vehiculos/actualizar-masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Vehiculos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/actualizar-masivo", async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.bulkUpdate(body);
    res.json({
      message: "vehiculos actualizados",
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /vehiculos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Vehiculos]
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
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    await service.update(id, body);
    res.json({
      message: "item actualizado",
      data: body
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /vehiculos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Vehiculos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.delete(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
