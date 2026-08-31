const express = require("express");

const itemService = require("../../services/transporte/tanqueos.service");
const router = express.Router();
const service = new itemService();

/**
 * @swagger
 * /tanqueo:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Tanqueo]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res, next) => {
  try {
    const result = await service.find();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tanqueo/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Tanqueo]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit, req.query || {});
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tanqueo/cargar-combustible:
 *   post:
 *     summary: POST /cargar-combustible
 *     tags: [Tanqueo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/cargar-combustible", async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.cargarCombustible(body);
    res.json({
      message: "combustible cargado",
      data: itemNuevo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tanqueo/ajustar-saldo:
 *   post:
 *     summary: POST /ajustar-saldo
 *     tags: [Tanqueo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/ajustar-saldo", async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.ajustarSaldo(body);
    res.json({
      message: "saldo ajustado",
      data: itemNuevo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tanqueo/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Tanqueo]
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
 * /tanqueo:
 *   post:
 *     summary: Crea un registro
 *     tags: [Tanqueo]
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
      data: itemNuevo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tanqueo/encontrar:
 *   post:
 *     summary: POST /encontrar
 *     tags: [Tanqueo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/encontrar", async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.findAll(body);
    res.json({
      message: "items encontrados",
      data: itemNuevo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tanqueo/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Tanqueo]
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
    const result = await service.update(id, body);
    res.json({
      message: "item actualizado",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tanqueo/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Tanqueo]
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
