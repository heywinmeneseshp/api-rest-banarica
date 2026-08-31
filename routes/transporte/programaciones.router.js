const express = require("express");
const passport = require("passport");

const itemService = require("../../services/transporte/programaciones.service");
const env = require("../../config/env");
const router = express.Router();
const service = new itemService();

/**
 * @swagger
 * tags:
 *   name: Programaciones
 *   description: Programador de transporte (movimientos de vehiculos)
 */

/**
 * @swagger
 * /programaciones:
 *   get:
 *     summary: Lista todas las programaciones (sin paginar)
 *     tags: [Programaciones]
 *     responses:
 *       200:
 *         description: Lista completa de programaciones
 */
router.get("/", async (req, res, next) => {
  try {
    const result = await service.find();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programaciones/paginar:
 *   post:
 *     summary: Pagina y filtra el programador (fecha, movimiento_id, contenedor, bl, vehiculo, conductor, etc.)
 *     tags: [Programaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha: { type: string, example: "2026-08-21" }
 *               fechaFin: { type: string, example: "2026-08-25" }
 *               movimiento_id:
 *                 oneOf:
 *                   - type: integer
 *                   - type: array
 *                     items: { type: integer }
 *               contenedor: { type: string, example: "MNBU4409407" }
 *               bl: { type: string }
 *               vehiculo: { type: string }
 *               conductor: { type: string }
 *               estado_listado: { type: string, enum: [pendiente, actualizado] }
 *     responses:
 *       200:
 *         description: Pagina de resultados
 */
router.post("/paginar", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const body = req.body;
    const items = await service.paginate(page, limit, body, req.user);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// ─── Endpoint para Excel / Power Query ──────────────────────────────────────
// GET /api/v1/programaciones/excel?api_key=TU_KEY&semana=W01&fechaInicio=2025-01-01&fechaFin=2025-12-31&transportadoraId=3
// Autenticación: header "api: TU_KEY"  o  query param "?api_key=TU_KEY"
/**
 * @swagger
 * /programaciones/excel:
 *   get:
 *     summary: GET /excel
 *     tags: [Programaciones]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/excel", async (req, res, next) => {
  try {
    const apiKey = req.headers["api"] || req.query.api_key;
    if (!apiKey || apiKey !== env.apiKey) {
      return res.status(401).json({ message: "API key invalida o no proporcionada" });
    }
    const { semana, fechaInicio, fechaFin, transportadoraId } = req.query;
    const result = await service.getForExcel({ semana, fechaInicio, fechaFin, transportadoraId });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Historial general (filtrable), util para consultar que habia antes de una
// eliminacion ya que la fila deja de existir en programacion (hard delete).
// Debe ir antes de "/:id" para que Express no lo confunda con un id.
/**
 * @swagger
 * /programaciones/historial/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Programaciones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/historial/paginar", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await service.paginarHistorial(page, limit, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programaciones/{id}/historial:
 *   get:
 *     summary: GET /:id/historial
 *     tags: [Programaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/:id/historial", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.historialPorId(id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programaciones/{id}:
 *   get:
 *     summary: Trae una programacion por id
 *     tags: [Programaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: La programacion encontrada }
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.findOne(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programaciones:
 *   post:
 *     summary: Crea una linea de programacion (movimiento de vehiculo)
 *     tags: [Programaciones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fecha, ruta_id, vehiculo_id]
 *             properties:
 *               fecha: { type: string, example: "2026-08-21" }
 *               bl: { type: string }
 *               contenedor: { type: string, example: "MNBU4409407" }
 *               ruta_id: { type: integer }
 *               vehiculo_id: { type: integer }
 *               conductor_id: { type: integer }
 *               movimiento: { type: string, description: "Texto del movimiento (compatibilidad). Preferir movimiento_id." }
 *               movimiento_id: { type: integer, description: "Id del catalogo tipo_movimiento_vehiculos (preferido sobre 'movimiento')" }
 *     responses:
 *       200: { description: Programacion creada }
 */
router.post("/",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const body = req.body;
      const itemNuevo = await service.create(body, req.user?.username);
      res.json({
        message: "item creado",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }
  });

/**
 * @swagger
 * /programaciones/{id}:
 *   patch:
 *     summary: Actualiza una linea de programacion (parcial)
 *     tags: [Programaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movimiento_id: { type: integer }
 *               vehiculo_id: { type: integer }
 *               conductor_id: { type: integer }
 *               contenedor: { type: string }
 *               llegada_origen: { type: string, example: "08:30" }
 *               salida_origen: { type: string, example: "09:00" }
 *               estado_listado: { type: string, enum: [pendiente, actualizado] }
 *     responses:
 *       200: { description: Programacion actualizada }
 */
router.patch("/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      await service.update(id, body, req.user?.username)
      res.json({
        message: "item actualizado",
        data: body
      })
    } catch (error) {
      next(error)
    }
  });

/**
 * @swagger
 * /programaciones/{id}:
 *   delete:
 *     summary: Elimina (hard delete) una linea de programacion
 *     tags: [Programaciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Programacion eliminada }
 */
router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.delete(id, req.user?.username)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programaciones/actualizar-masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Programaciones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/actualizar-masivo", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const rows = req.body;
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ message: 'Se requiere un array de programaciones' });
    }
    const result = await service.bulkUpdate(rows, req.user?.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
