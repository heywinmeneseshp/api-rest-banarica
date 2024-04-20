const express = require("express");

const itemService = require("../../services/transporte/record_consumo.service");
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

// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
router.post("/paginar", async (req, res, next) => {
  try {
  
    const item = req.body
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit, item);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/encontrar-uno", async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.findOne(body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/sin-liquidar", async (req, res, next) => {
  try {
    const result = await service.sinLiquidar();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/",
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

  router.post("/consultar-consumo",
  async (req, res, next) => {
    try {
      const body = req.body;
      const itemNuevo = await service.consultarConsumo(body);
      res.json({
        message: "Consulta Existosa",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }
  });

  router.get("/consultar-consumo",
  async (req, res, next) => {
    try {
      const body = req.body;
      const itemNuevo = await service.consultarConsumo(body);
      res.json({
        message: "Consulta Existosa",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }
  });

  //Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
  router.post("/liquidar",
  async (req, res, next) => {
    try {
      const body = req.body;
      const itemNuevo = await service.liquidar(body);
      res.json({
        message: "Consulta Existosa",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }
  });


router.patch("/:id",
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const item = await service.update(id, body)
      res.json({
        message: "item actualizado",
        data: item
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
