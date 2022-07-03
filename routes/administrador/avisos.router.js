const express = require("express");
const AvisosService = require('../../services/avisos.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearAviso, actualizarAviso } = require('../../schema/aviso.schema');


const router = express.Router();
const service = new AvisosService();

router.get("/", async (req, res) => {
  try {
    const avisos = await service.find();
    res.json(avisos);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const aviso = await service.findOne(id);
    res.json(aviso);
  } catch (error) {
    next(error)
  }
});

//Crear
router.post("/",
validatorHandler(crearAviso, "body"),
async (req, res, next) => {
  try {
    const body = req.body;
    const avisoNuevo = await service.create(body);
    res.json({
      message: "Aviso creado",
      data: avisoNuevo
    })
  } catch (error) {
    next(error);
  }

});

//ACTUALIZACIONES PARCIALES
router.patch("/:id",
validatorHandler(actualizarAviso, "body"),
async (req, res, next) => {
  try {
    const { id } = req.params
    const body = req.body;
    const aviso = await service.update(id, body)
    res.json({
      message: 'El aviso fue actualizado',
      data: aviso,
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
