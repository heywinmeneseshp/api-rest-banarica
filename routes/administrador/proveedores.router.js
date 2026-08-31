const express = require("express");

const ProveedoresService = require('../../services/proveedores.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearProveedor, actualizarProveedor } = require('../../schema/proveedor.schema');


const router = express.Router();
const service = new ProveedoresService();

/**
 * @swagger
 * /proveedores:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Proveedores]
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
 * /proveedores/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Proveedores]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit, nombre } = req.query;
    const items = await service.paginate(page, limit, nombre);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /proveedores/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Proveedores]
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
 * /proveedores:
 *   post:
 *     summary: Crea un registro
 *     tags: [Proveedores]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
validatorHandler(crearProveedor, "body"),
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
 * /proveedores/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Proveedores]
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
validatorHandler(actualizarProveedor, "body"),
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
 * /proveedores/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Proveedores]
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
