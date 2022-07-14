const express = require("express");

const StockService = require('../services/stock.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearProductoEnAlmacen, addAndSubtract, habilitarDeshabilitar } = require('../schema/stock.schema');



const router = express.Router();
const service = new StockService();


//Crear
router.post("/",
validatorHandler(crearProductoEnAlmacen, "body"),
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

router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/filter/:cons_almacen/:cons_producto", async (req, res, next) => {
  try {
    const { cons_almacen, cons_producto } = req.params;
    const item = await service.filter(cons_almacen, cons_producto);
    res.json(item);
  } catch (error) {
    next(error);
  }
}

)

//ACTUALIZACIONES PARCIALES
router.patch("/habilitar/:cons_almacen/:cons_producto",
validatorHandler(habilitarDeshabilitar, "body"),
async (req, res, next) => {
  try {
    const { cons_almacen, cons_producto } = req.params
    const changes = req.body;
    const item = await service.update(cons_almacen, cons_producto, changes)
    res.json({
      message: 'El item fue actualizado',
      data: item
    })
  } catch (error) {
    next(error);
  }
});

router.patch("/sumar/:cons_almacen/:cons_producto",
validatorHandler(addAndSubtract, "body"),
async (req, res, next) => {
  try {
    const { cons_almacen, cons_producto } = req.params
    const changes = req.body;
    console.log(cons_almacen, cons_producto, changes)
    const item = await service.addAmounts(cons_almacen, cons_producto, changes)
    res.json({
      message: 'El item fue actualizado',
      data: item
    })
  } catch (error) {
    next(error);
  }
});

router.patch("/restar/:cons_almacen/:cons_producto",
validatorHandler(addAndSubtract, "body"),
async (req, res, next) => {
  try {
    const { cons_almacen, cons_producto } = req.params
    const changes = req.body;
    const item = await service.subtractAmounts(cons_almacen, cons_producto, changes)
    res.json({
      message: 'El item fue actualizado',
      data: item
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





//ELIMINAR
router.delete("/:cons_almacen/:cons_producto", async (req, res, next) => {
  const { cons_almacen, cons_producto } = req.params
  try {
    const result = await service.delete(cons_almacen, cons_producto )
    res.json(result)
  } catch (error) {
    next(error);
  }
});

module.exports = router;
