const express = require("express");

const AlmacenesService = require("./../../services/almacenes.service");
const validatorHandler = require('./../../middlewares/validator.handler');
const { crearAlmacen, actualizarAlmacen } = require('./../../schema/almacen.schema');

const router = express.Router();
const service = new AlmacenesService();

router.get("/", async (req, res, next) => {
  try {
    const result = await service.find();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/filter", (req, res) => {
  const { limit, offset } = req.query;
  res.json({ limit: limit, offset: offset })
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.findOne(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/",
validatorHandler(crearAlmacen, "body"),
async (req, res, next) => {
  try {
    const body = req.body;
    const almacenNuevo = await service.create(body);
    res.json({
      message: "Almacen creado",
      data: almacenNuevo
    })
  } catch (error) {
    next(error);
  }
});

router.patch("/:id",
validatorHandler(actualizarAlmacen, "body"),
async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const almacen = await service.update(id, body)
    res.json({
      message: "Almacen actualizado",
      data: almacen
    })
  } catch (error) {
    next(error)
  }
});

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
