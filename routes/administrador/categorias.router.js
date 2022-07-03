const express = require("express");

const CategoriasServices = require('./../../services/categorias.service');
const validatorHandler = require("../../middlewares/validator.handler.js");
const { crearcategoria, actualizarCategoria } = require('../../schema/categoria.schema');

const router = express.Router();
const service = new CategoriasServices();


router.get("/", async (req, res) => {
  try {
    const categorias = await service.find();
    res.json(categorias);
  } catch (error) {
    next(error);
  }
});

// Ejemplo localhost:3000/categorias/filter?limit=10&offset=12
router.get("/filter", async (req, res) => {
  const { limit, offset } = req.query;
  res.json({ limit: limit, offset: offset })
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const categoria = await service.findOne(id);
    res.json(categoria);
  } catch (error) {
    next(error)
  }
});

//Crear
router.post("/",
validatorHandler(crearcategoria, "body"),
async (req, res, next) => {
  try {
    const body = req.body;
    const categoriaNuevo = await service.create(body);
    res.json({
      message: "Categoria creada",
      data: categoriaNuevo
    })
  } catch (error) {
    next(error);
  }

});

//ACTUALIZACIONES PARCIALES
router.patch("/:id",
validatorHandler(actualizarCategoria, "body"),
async (req, res, next) => {
  try {
    const { id } = req.params
    const body = req.body;
    const categoria = await service.update(id, body)
    res.json({
      message: 'El categoria fue actualizado',
      data: categoria,
      id
    })
  } catch (error) {
    next(error);
  }
});

//ELIMINAR
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
