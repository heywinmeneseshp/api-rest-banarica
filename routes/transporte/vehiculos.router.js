const express = require("express");

const itemService = require("../../services/transporte/vehiculos.service");
const router = express.Router();
const service = new itemService();

router.get("/", async (req, res, next) => {
  try {
    const result = await service.find();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit, item } = req.query;
    const items = await service.paginate(page, limit, item);
    res.json(items);
  } catch (error) {
    next(error);
  }
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

router.post("/", async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.create(body);
    res.json({
      message: "item creado",
      data: itemNuevo
    });
  } catch (error) {
    next(error);
  }
});

router.post("/masivo", async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.bulkCreate(body);
    res.json({
      message: "vehiculos creados",
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.post("/actualizar-masivo", async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.bulkUpdate(body);
    res.json({
      message: "vehiculos actualizados",
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    await service.update(id, body);
    res.json({
      message: "item actualizado",
      data: body
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.delete(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
