const express = require("express");

const combosService = require('../../services/combos.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearCombo, actualizarCombo, armarCombo } = require('../../schema/combo.schema');

const router = express.Router();
const service = new combosService();

router.get("/", async (req, res) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/listar", async (req, res, next) => {
  try {
    const result = await service.findAllCombos();
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }

})

router.get("/listar/:id_combo", async (req, res, next) => {
  try {
    const { id_combo } = req.params
    const result = await service.findOneCombo(id_combo);
    console.log(result)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }

})

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const Items = await service.findOne(id);
    res.json(Items);
  } catch (error) {
    next(error)
  }
});



//Crear
router.post("/",
  validatorHandler(crearCombo, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const ItemsNuevo = await service.create(body);
      res.json({
        message: "Items creado",
        data: ItemsNuevo
      })
    } catch (error) {
      next(error);
    }
  });

router.post("/listar",
  validatorHandler(armarCombo, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const productoEnCombo = await service.armarCombo(body.id_combo, body.id_producto);
      res.json({
        message: "Items creado",
        data: productoEnCombo
      })
    } catch (error) {
      next(error);
    }
  })

//ACTUALIZACIONES PARCIALES
router.patch("/:id",
  validatorHandler(actualizarCombo, "body"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const body = req.body;
      const Items = await service.update(id, body)
      res.json({
        message: 'El Items fue actualizado',
        data: Items,
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
    await service.deleteAllWith(id);
    const result = await service.delete(id)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

module.exports = router;
