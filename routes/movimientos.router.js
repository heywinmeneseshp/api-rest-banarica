const express = require("express");

const MovimientosService = require('../services/movimientos.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearMovimiento, actualizarMovimiento } = require('../schema/movimiento.schema');


const router = express.Router();
const service = new MovimientosService();

router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/document", async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.findDocument(body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});


// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

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
router.post("/",
validatorHandler(crearMovimiento, "body"),
async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.create(body);
    res.json({
      message: "item creado",
      data: itemNuevo
    })
  } catch (error) {
    res.json({
      message: error.message
    })
    next(error);
  }

});

//ACTUALIZACIONES PARCIALES
router.patch("/:id",
validatorHandler(actualizarMovimiento, "body"),
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
