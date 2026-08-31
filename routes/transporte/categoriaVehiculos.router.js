const express = require("express");

const itemesService = require("./../../services/transporte/categoriaVehiculos.service");
const router = express.Router();
const service = new itemesService();

/**
 * @swagger
 * /categoriaVehiculos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [CategoriaVehiculos]
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

// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
/**
 * @swagger
 * /categoriaVehiculos/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [CategoriaVehiculos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit, item } = req.query;
    const items = await service.paginate(page, limit, item);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /categoriaVehiculos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [CategoriaVehiculos]
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
 * /categoriaVehiculos/masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [CategoriaVehiculos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/masivo", async (req, res, next) => {
  try { res.json(await service.bulkCreate(req.body)); } catch (e) { next(e); }
});

/**
 * @swagger
 * /categoriaVehiculos/masivo-actualizar:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [CategoriaVehiculos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/masivo-actualizar", async (req, res, next) => {
  try { res.json(await service.bulkUpdate(req.body)); } catch (e) { next(e); }
});

/**
 * @swagger
 * /categoriaVehiculos:
 *   post:
 *     summary: Crea un registro
 *     tags: [CategoriaVehiculos]
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

/**
 * @swagger
 * /categoriaVehiculos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [CategoriaVehiculos]
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
      const { id } = req.params;
      const body = req.body;
      await service.update(id, body)
      res.json({
        message: "item actualizado",
        data: body
      })
    } catch (error) {
      next(error)
    }
  });

/**
 * @swagger
 * /categoriaVehiculos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [CategoriaVehiculos]
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
    const result = await service.delete(id)
    res.json(result)
  } catch (error) {
    next(error);
  }
})

module.exports = router;
