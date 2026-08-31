const express = require("express");

const ConductoresServices = require('../../services/conductores.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearConductor, actualizarConductor } = require('../../schema/conductor.schema');


const router = express.Router();
const service = new ConductoresServices();

/**
 * @swagger
 * /conductores:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Conductores]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res) => {
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
 * /conductores/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Conductores]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit, nombre, transportadoraId } = req.query;
    const items = await service.paginate(page, limit, nombre, transportadoraId);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /conductores/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Conductores]
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
 * /conductores:
 *   post:
 *     summary: Crea un registro
 *     tags: [Conductores]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
  validatorHandler(crearConductor, "body"),
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
 * /conductores/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Conductores]
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
  validatorHandler(actualizarConductor, "body"),
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
 * /conductores/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Conductores]
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
