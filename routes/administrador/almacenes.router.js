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

router.get("/:consecutivo", async (req, res, next) => {
  try {
    const { consecutivo } = req.params;
    const result = await service.findOne(consecutivo);
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

router.patch("/:consecutivo",
validatorHandler(actualizarAlmacen, "body"),
async (req, res, next) => {
  try {
    const { consecutivo } = req.params;
    const body = req.body;
    await service.update(consecutivo, body)
    res.json({
      message: "Almacen actualizado",
      data: body
    })
  } catch (error) {
    next(error)
  }
});

router.delete("/:consecutivo", async (req, res, next) => {
  const { consecutivo } = req.params;
  try {
    const result = await service.delete(consecutivo)
    res.json(result)
  } catch (error) {
    next(error);
  }
})

module.exports = router;
