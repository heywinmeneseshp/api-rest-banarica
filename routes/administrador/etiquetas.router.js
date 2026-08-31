const express = require("express");

const EtiquetaServices = require('../../services/etiquetas.service')


const router = express.Router();
const service = new EtiquetaServices();

/**
 * @swagger
 * /etiquetas:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Etiquetas]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res, next) => {
  try {
    const items = await service.findTags()
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Ejemplo http://localhost:3000/api/v1/etiquetas/:consecutivo
/**
 * @swagger
 * /etiquetas/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Etiquetas]
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
    const items = await service.findOne(id)
    res.json(items);
  } catch (error) {
    next(error);
  }
});


//Crear
/**
 * @swagger
 * /etiquetas:
 *   post:
 *     summary: Crea un registro
 *     tags: [Etiquetas]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
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
 * /etiquetas/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Etiquetas]
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
  async (req, res, next) => {
    try {
      const { id } = req.params
      const changes = req.body;
      const item = await service.updateTage(id, changes)
      res.json({
        message: 'El item fue actualizado',
        data: item
      })
    } catch (error) {
      next(error);
    }
  });


module.exports = router;
