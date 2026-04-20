const express = require("express");

const itemService = require("../../services/transporte/consumoRutaVehiculo.service");
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

// Ejemplo http://localhost:3000/api/v1/consumoRutaVehiculo/paginar?page=1&limit=4
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
  try {
    const { id } = req.params;
    const result = await service.findOne(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/",
  async (req, res, next) => {
    try {
      const body = req.body;
      const result = await service.create(body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

router.patch("/:id",
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const result = await service.update(id, body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.delete(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;