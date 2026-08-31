const express = require("express");

const SemanasService = require('../../services/semanas.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearSemana, actualizarSemana } = require('../../schema/semana.schema');


const router = express.Router();
const service = new SemanasService();

/**
 * @swagger
 * /semanas:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Semanas]
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
 * /semanas/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Semanas]
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

/**
 * @swagger
 * /semanas/filter:
 *   post:
 *     summary: POST /filter
 *     tags: [Semanas]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/filter", async (req, res, next) => {
  const body = req.body;
  try {
    const item = await service.filtrar(body);
    res.json(item);
  } catch (error) {
    next(error)
  }
});

/**
 * @swagger
 * /semanas/rango:
 *   post:
 *     summary: POST /rango
 *     tags: [Semanas]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/rango", async (req, res, next) => {
  try {
    const items = await service.rangoSemana(req.body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Ejemplo: http://localhost:3000/api/v1/semanas/paginar?offset=1&limit=4
/**
 * @swagger
 * /semanas/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Semanas]
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
    const { offset, limit, consecutivo } = req.query;
    console.log("hewwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww", offset, limit, consecutivo  )
    const items = await service.paginar(offset, limit, consecutivo);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

//Crear
/**
 * @swagger
 * /semanas:
 *   post:
 *     summary: Crea un registro
 *     tags: [Semanas]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
  validatorHandler(crearSemana, "body"),
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
 * /semanas/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Semanas]
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
  validatorHandler(actualizarSemana, "body"),
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
 * /semanas/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Semanas]
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
