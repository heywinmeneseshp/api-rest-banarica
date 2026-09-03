const express = require("express");
const passport = require('passport');

const MovimientosService = require('../services/movimientos.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearMovimiento, actualizarMovimiento } = require('../schema/movimiento.schema');
const { checkSuperAdminRole } = require('../middlewares/auth.handler');


const router = express.Router();
const service = new MovimientosService();

router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /movimientos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Movimientos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /movimientos/document:
 *   post:
 *     summary: POST /document
 *     tags: [Movimientos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/document", async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.findDocument(body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});


// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
/**
 * @swagger
 * /movimientos/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Movimientos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /movimientos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Movimientos]
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
    const item = await service.findOne(id);
    res.json(item);
  } catch (error) {
    next(error)
  }
});

//Crear
/**
 * @swagger
 * /movimientos:
 *   post:
 *     summary: Crea un registro
 *     tags: [Movimientos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
validatorHandler(crearMovimiento, "body"),
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
/**
 * @swagger
 * /movimientos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Movimientos]
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
validatorHandler(actualizarMovimiento, "body"),
async (req, res, next) => {
  try {
    const { id } = req.params
    const body = req.body;
    // Aprobar/rechazar una Liquidacion o Devolucion pendiente es una accion
    // privilegiada (el frontend solo la ofrece a Super administrador); un
    // Ajuste corriente tambien usa este mismo PATCH para editar fecha/semana
    // y esa parte debe seguir abierta a cualquier usuario autenticado, asi
    // que el gateo es por los campos que llegan, no por la ruta entera.
    if (('pendiente' in body || 'aprobado_por' in body)) {
      checkSuperAdminRole(req, res, (err) => { if (err) throw err; });
    }
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
/**
 * @swagger
 * /movimientos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Movimientos]
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
