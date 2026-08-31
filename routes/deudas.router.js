const express = require("express");

const DeudasService = require('../services/deudas.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearDeuda, actualizarDeuda } = require('../schema/deuda.schema');


const router = express.Router();
const service = new DeudasService();

/**
 * @swagger
 * /deudas:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Deudas]
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

// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
/**
 * @swagger
 * /deudas/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Deudas]
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

// Ejemplo localhost:3000/productos/filter?prestador=200&deudor=300
/**
 * @swagger
 * /deudas/filter:
 *   get:
 *     summary: GET /filter
 *     tags: [Deudas]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/filter", async (req, res, next) => {
  try {
    const { prestador, deudor } = req.query;
    const result = await service.filter(prestador, deudor);
    res.json(result)
  } catch (error) {
    next(error)
  }
});

/**
 * @swagger
 * /deudas/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Deudas]
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
 * /deudas:
 *   post:
 *     summary: Crea un registro
 *     tags: [Deudas]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
validatorHandler(crearDeuda, "body"),
async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.create(body);
    res.json({
      message: "item creado",
      data: itemNuevo
    })
  } catch (error) {
    next(error);
  }

});

//ACTUALIZACIONES PARCIALES
/**
 * @swagger
 * /deudas/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Deudas]
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
validatorHandler(actualizarDeuda, "body"),
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
 * /deudas/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Deudas]
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
