const { response } = require("express");
const express = require("express");

const ProductosService = require('../services/productos.service');

const router = express.Router();
const service = new ProductosService();


router.get("/", async (req, res) => {
  const productos = await service.find();
  res.json(productos);
});

// Ejemplo localhost:3000/productos/filter?limit=10&offset=12
router.get("/filter", async (req, res) => {
  const { limit, offset } = req.query;
  res.json({ limit: limit, offset: offset })
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const producto = await service.findOne(id);
  res.json(producto);
});

//Crear
router.post("/", async (req, res) => {
  const body = req.body;
  const productoNuevo = await service.create(body);
  res.json({
    message: "Producto creado",
    data: productoNuevo
  })

});

//ACTUALIZACIONES PARCIALES
router.patch("/:id", async (req, res) => {
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
    res.status(404).json({messaje: error.message})
  }
});

//ACTUALIZACIONES TOTALES
router.put("/:id", (req, res) => {
  const { id } = req.params
  const body = req.body;
  res.json({
    message: 'actualizado',
    data: body,
    id
  })
});

//ELIMINAR
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  const result = await service.delete(id)
  res.json(result)
});

module.exports = router;
