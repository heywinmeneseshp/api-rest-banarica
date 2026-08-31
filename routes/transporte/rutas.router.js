const express = require("express");

const itemesService = require("../../services/transporte/rutas.service");
const router = express.Router();
const service = new itemesService();

/**
 * @swagger
 * /rutas:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Rutas]
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
 * /rutas/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Rutas]
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
 * /rutas/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Rutas]
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
 * /rutas:
 *   post:
 *     summary: Crea un registro
 *     tags: [Rutas]
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
   * /rutas/buscar:
   *   post:
   *     summary: POST /buscar
   *     tags: [Rutas]
   *     security: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { type: object }
   *     responses:
   *       200: { description: OK }
   */
  router.post("/buscar",
  async (req, res, next) => {
    try {
      const body = req.body;
      const itemNuevo = await service.findWhere(body);
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
 * /rutas/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Rutas]
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
 * /rutas/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Rutas]
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
