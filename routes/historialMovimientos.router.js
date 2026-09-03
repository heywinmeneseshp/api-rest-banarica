const express = require("express");
const passport = require('passport');

const HistorialMovimientosService = require('../services/historialMovimientos.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearHistorialMovimiento, actualizarHistorialMovimiento } = require('../schema/historialMovimiento.schema');

const router = express.Router();
const service = new HistorialMovimientosService();

router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /historial-movimientos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Historial-movimientos]
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

// query localhost:3000/api/administrador/notificaciones/filter?titulo=titulo&descripcion=descripcion&tipo=tipo&estado=estado
/**
 * @swagger
 * /historial-movimientos/filter:
 *   get:
 *     summary: GET /filter
 *     tags: [Historial-movimientos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/filter",
  validatorHandler(actualizarHistorialMovimiento, "query"),
  async (req, res, next) => {
    try {
      const body = req.query;
      const items = await service.filter(body);
      res.json(items)
    } catch (error) {
      next(error);
    }
  });

  /**
   * @swagger
   * /historial-movimientos/filter:
   *   post:
   *     summary: POST /filter
   *     tags: [Historial-movimientos]
   *     security: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { type: object }
   *     responses:
   *       200: { description: OK }
   */
  router.post("/filter",
  validatorHandler(actualizarHistorialMovimiento, "query"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const items = await service.generalFilter(body);
      res.json(items)
    } catch (error) {
      next(error);
    }
  });


// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
/**
 * @swagger
 * /historial-movimientos/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Historial-movimientos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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

/**
 * @swagger
 * /historial-movimientos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Historial-movimientos]
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
 * /historial-movimientos:
 *   post:
 *     summary: Crea un registro
 *     tags: [Historial-movimientos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
  validatorHandler(crearHistorialMovimiento, "body"),
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
/**
 * @swagger
 * /historial-movimientos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Historial-movimientos]
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
  validatorHandler(actualizarHistorialMovimiento, "body"),
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
/**
 * @swagger
 * /historial-movimientos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Historial-movimientos]
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
