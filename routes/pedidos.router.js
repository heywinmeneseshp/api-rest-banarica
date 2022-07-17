const express = require("express");

const PedidosService = require('../services/pedidos.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearPedido, editarPedido, ingresarConsPedido, recibirPedido } = require('../schema/pedido.schema');


const router = express.Router();
const service = new PedidosService();

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
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

//Listar consecutivos de pedidos
router.get("/listar", async (req, res, next) => {
  try {
    const items = await service.findAllCons();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/listar/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const items = await service.findOneCons(id);
    res.json(items);
  } catch (error) {
    next(error);
  }
});


router.post("/listar",
validatorHandler(ingresarConsPedido, "body"),
async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.createCons(body);
    res.json({
      message: "item creado",
      data: itemNuevo
    })
  } catch (error) {
    next(error);
  }
});

//ACTUALIZACIONES PARCIALES
router.patch("/listar/:id",
validatorHandler(recibirPedido, "body"),
async (req, res, next) => {
  try {
    const { id } = req.params
    const body = req.body;
    const item = await service.receiveOrder(id, body)
    res.json({
      message: 'El item fue actualizado',
      data: item,
      id
    })
  } catch (error) {
    next(error);
  }
});

router.delete("/listar/:id", async (req, res, next) => {
  const { id } = req.params
  try {
    const result = await service.deleteCons(id)
    res.json(result)
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
validatorHandler(crearPedido, "body"),
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
validatorHandler(editarPedido, "body"),
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
