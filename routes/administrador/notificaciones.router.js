const express = require("express");

const NotificacionesService = require('../../services/notificaciones.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearNotificacion, actualizarNotificacion } = require('../../schema/notificacion.schema');


const router = express.Router();
const service = new NotificacionesService();

router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});


//Crear
// query localhost:3000/api/administrador/notificaciones/filter?titulo=titulo&descripcion=descripcion&tipo=tipo&estado=estado
router.get("/filter",
validatorHandler(actualizarNotificacion, "query"),
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
async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.filterPost(body);
    res.json(items)
  } catch (error) {
    next(error);
  }
});

router.post("/filter/usuarios",
async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.generalFilter(body);
    res.json(items)
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
validatorHandler(crearNotificacion, "body"),
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
validatorHandler(actualizarNotificacion, "body"),
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

