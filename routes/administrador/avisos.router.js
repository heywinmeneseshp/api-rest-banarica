const express = require("express");
const AvisosService = require('../../services/avisos.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearAviso, actualizarAviso } = require('../../schema/aviso.schema');

const passport = require("passport");
const { checkSuperAdminRole } = require('../../middlewares/auth.handler');

const router = express.Router();
const service = new AvisosService();

/**
 * @swagger
 * /avisos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Avisos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res, next) => {
  try {
    const avisos = await service.find();
    res.json(avisos);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /avisos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Avisos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /avisos:
 *   post:
 *     summary: Crea un registro
 *     tags: [Avisos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
  passport.authenticate('jwt', { session: false }),
  checkSuperAdminRole,
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
/**
 * @swagger
 * /avisos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Avisos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /avisos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Avisos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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
