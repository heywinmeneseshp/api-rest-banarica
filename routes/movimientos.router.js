const express = require("express");

const MovimientosService = require('../services/movimientos.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearMovimiento, actualizarMovimiento } = require('../schema/movimiento.schema');


const router = express.Router();
const service = new MovimientosService();

/**
 * @swagger
 * /movimientos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Movimientos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /movimientos/document:
 *   post:
 *     summary: POST /document
 *     tags: [Movimientos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/document", async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.findDocument(body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});


// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
/**
 * @swagger
 * /movimientos/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Movimientos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /movimientos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Movimientos]
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
  const { id } = req.params;
  try {
    const item = await service.findOne(id);
    res.json(item);
  } catch (error) {
    next(error)
  }
});

//Crear
/**
 * @swagger
 * /movimientos:
 *   post:
 *     summary: Crea un registro
 *     tags: [Movimientos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
validatorHandler(crearMovimiento, "body"),
async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.create(body);
    res.json({
      message: "item creado",
      data: itemNuevo
    })
  } catch (error) {
    res.json({
      message: error.message
    })
    next(error);
  }

});

//ACTUALIZACIONES PARCIALES
/**
 * @swagger
 * /movimientos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Movimientos]
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
router.patch("/:id",
validatorHandler(actualizarMovimiento, "body"),
async (req, res, next) => {
  try {
    const { id } = req.params
    const body = req.body;
    const item = await service.update(id, body)
    res.json({
      message: 'El item fue actualizado',
      data: item,
      id
    })
  } catch (error) {
    next(error);
  }
});

//ELIMINAR
/**
 * @swagger
 * /movimientos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Movimientos]
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
  const { id } = req.params
  try {
    const result = await service.delete(id)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

module.exports = router;
