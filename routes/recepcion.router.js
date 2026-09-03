const express = require("express");
const passport = require('passport');

const RecepcionService = require('../services/recepcion.service');
const validatorHandler = require('../middlewares/validator.handler');
const { ingresarRemision, actualizarRemision } = require('../schema/recepcion.schema');


const router = express.Router();
const service = new RecepcionService();

router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /recepcion:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Recepcion]
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
 * /recepcion/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Recepcion]
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
 * /recepcion/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Recepcion]
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
 * /recepcion:
 *   post:
 *     summary: Crea un registro
 *     tags: [Recepcion]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
validatorHandler(ingresarRemision, "body"),
async (req, res, next) => {
  try {
    const body = req.body;
    console.log(body)
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
 * /recepcion/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Recepcion]
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
validatorHandler(actualizarRemision, "body"),
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
 * /recepcion/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Recepcion]
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
