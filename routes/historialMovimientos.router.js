const express = require("express");

const HistorialMovimientosService = require('../services/historialMovimientos.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearHistorialMovimiento, actualizarHistorialMovimiento } = require('../schema/historialMovimiento.schema');

const router = express.Router();
const service = new HistorialMovimientosService();

router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// query localhost:3000/api/administrador/notificaciones/filter?titulo=titulo&descripcion=descripcion&tipo=tipo&estado=estado
router.get("/filter",
  validatorHandler(actualizarHistorialMovimiento, "query"),
  async (req, res, next) => {
    try {
      const body = req.query;
      const items = await service.filter(body);
      res.json(items)
    } catch (error) {
      next(error);
    }
  });

  router.post("/filter",
  validatorHandler(actualizarHistorialMovimiento, "query"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const items = await service.generalFilter(body);
      res.json(items)
    } catch (error) {
      next(error);
    }
  });


// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
router.post("/paginar", async (req, res, next) => {
  try {
    const { almacenes } = req.body;
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit, almacenes);
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
  validatorHandler(crearHistorialMovimiento, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      console.log(body)
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
router.patch("/:id",
  validatorHandler(actualizarHistorialMovimiento, "body"),
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
