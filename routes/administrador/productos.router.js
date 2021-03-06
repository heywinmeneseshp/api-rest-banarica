const express = require("express");

const ProductosService = require('./../../services/productos.service');
const validatorHandler = require("../../middlewares/validator.handler.js");
const { crearProducto, actualizarProducto } = require('../../schema/product.schema');

const router = express.Router();
const service = new ProductosService();


router.get("/", async (req, res) => {
  try {
    const productos = await service.find();
    res.json(productos);
  } catch (error) {
    next(error);
  }
});

// Ejemplo localhost:3000/productos/filter?limit=10&offset=12
router.get("/filter", async (req, res) => {
  const { limit, offset } = req.query;
  res.json({ limit: limit, offset: offset })
});

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
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const result = await service.delete(id)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

module.exports = router;
