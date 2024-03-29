const express = require("express");
const TrasladosService = require('../services/traslados.service');
const validatorHandler = require('../middlewares/validator.handler');
const { realizarTraslado, modificarTraslado, recibirTraslado } = require('../schema/traslado.schema');


const router = express.Router();
const service = new TrasladosService();

router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
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

router.post("/filter", async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.filter(body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});


//ACTUALIZACIONES PARCIALES
router.patch("/modificar/:id",
  validatorHandler(modificarTraslado, "body"),
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

router.patch("/recibir/:id",
  validatorHandler(recibirTraslado, "body"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const body = req.body;
      const data = {
        ...body
      }
      const item = await service.update(id, data)
      res.json({
        message: 'El item fue actualizado',
        data: item,
        id
      })
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
  validatorHandler(realizarTraslado, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const data = {
        ...body
      }
      const itemNuevo = await service.create(data);
      res.json({
        message: "item creado",
        data: itemNuevo
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
