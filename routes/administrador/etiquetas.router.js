const express = require("express");

const EtiquetaServices = require('../../services/etiquetas.service')


const router = express.Router();
const service = new EtiquetaServices();

router.get("/", async (req, res, next) => {
  try {
    const items = await service.findTags()
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Ejemplo http://localhost:3000/api/v1/etiquetas/:consecutivo
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const items = await service.findOne(id)
    res.json(items);
  } catch (error) {
    next(error);
  }
});


//Crear
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

//ACTUALIZACIONES PARCIALES
router.patch("/:id",
  async (req, res, next) => {
    try {
      const { id } = req.params
      const changes = req.body;
      const item = await service.updateTage(id, changes)
      res.json({
        message: 'El item fue actualizado',
        data: item
      })
    } catch (error) {
      next(error);
    }
  });


module.exports = router;
