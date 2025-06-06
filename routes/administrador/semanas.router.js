const express = require("express");

const SemanasService = require('../../services/semanas.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearSemana, actualizarSemana } = require('../../schema/semana.schema');


const router = express.Router();
const service = new SemanasService();

router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
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

router.post("/filter", async (req, res, next) => {
  const body = req.body;
  try {
    const item = await service.filtrar(body);
    res.json(item);
  } catch (error) {
    next(error)
  }
});

// Ejemplo: http://localhost:3000/api/v1/semanas/paginar?offset=1&limit=4
router.post('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, consecutivo } = req.query;
    const items = await service.paginar(offset, limit, consecutivo);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

//Crear
router.post("/",
  validatorHandler(crearSemana, "body"),
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

//ACTUALIZACIONES PARCIALES
router.patch("/:id",
  validatorHandler(actualizarSemana, "body"),
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
