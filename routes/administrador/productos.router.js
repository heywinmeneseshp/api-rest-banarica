const express = require("express");

const ProductosService = require('./../../services/productos.service');
const validatorHandler = require("../../middlewares/validator.handler.js");
const { crearProducto, actualizarProducto } = require('../../schema/product.schema');

const router = express.Router();
const service = new ProductosService();

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Productos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res, next) => {
  try {
    const productos = await service.find();
    res.json(productos);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /productos/filter:
 *   post:
 *     summary: POST /filter
 *     tags: [Productos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/filter", async (req, res, next) => {
  try {
    const body = req.body
    const items = await service.findPost(body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /productos/categoria/{categoria}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Productos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: categoria
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/categoria/:categoria', async (req, res, next) => {
  try {
    const { categoria } = req.params
    const productos = await service.findAllByCategory(categoria);
    res.json(productos);
  } catch (error) {
    next(error);
  }
});

// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
/**
 * @swagger
 * /productos/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Productos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit, name } = req.query;
    const items = await service.paginate(page, limit, name);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /productos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Productos]
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
    const producto = await service.findOne(id);
    res.json(producto);
  } catch (error) {
    next(error)
  }
});

//Crear
/**
 * @swagger
 * /productos:
 *   post:
 *     summary: Crea un registro
 *     tags: [Productos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
  validatorHandler(crearProducto, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const productoNuevo = await service.create(body);
      res.json({
        message: "Producto creado",
        data: productoNuevo
      })
    } catch (error) {
      next(error);
    }

  });

//ACTUALIZACIONES PARCIALES
/**
 * @swagger
 * /productos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Productos]
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
  validatorHandler(actualizarProducto, "body"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const body = req.body;
      const producto = await service.update(id, body)
      res.json({
        message: 'El producto fue actualizado',
        data: producto,
        id
      })
    } catch (error) {
      next(error);
    }
  });

//ELIMINAR
/**
 * @swagger
 * /productos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Productos]
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
