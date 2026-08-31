const express = require("express");

const NotificacionesService = require('../../services/notificaciones.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearNotificacion, actualizarNotificacion } = require('../../schema/notificacion.schema');


const router = express.Router();
const service = new NotificacionesService();

/**
 * @swagger
 * /notificaciones:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Notificaciones]
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
 * /notificaciones/filter:
 *   post:
 *     summary: POST /filter
 *     tags: [Notificaciones]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/filter",
async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.filter(body);
    res.json(items)
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /notificaciones/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Notificaciones]
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
 * /notificaciones:
 *   post:
 *     summary: Crea un registro
 *     tags: [Notificaciones]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
validatorHandler(crearNotificacion, "body"),
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
 * /notificaciones/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Notificaciones]
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
validatorHandler(actualizarNotificacion, "body"),
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
 * /notificaciones/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Notificaciones]
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

//PAGINAR
// Ejemplo http://localhost:3000/api/v1/notificaciones/paginar?page=1&limit=4
/**
 * @swagger
 * /notificaciones/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Notificaciones]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/paginar", async (req, res, next) => {
  const body = req.body
  const { page, limit } = req.query
  try {
    const result = await service.paginate(page, limit, body)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

module.exports = router;

