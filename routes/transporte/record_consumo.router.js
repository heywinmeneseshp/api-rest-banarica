const express = require("express");

const itemService = require("../../services/transporte/record_consumo.service");
const router = express.Router();
const service = new itemService();

/**
 * @swagger
 * /record_consumo:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Record_consumo]
 *     security: []
 *     responses:
 *       200: { description: OK }
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
 * /record_consumo/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Record_consumo]
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
    const item = req.body;
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit, item);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /record_consumo/encontrar-uno:
 *   post:
 *     summary: POST /encontrar-uno
 *     tags: [Record_consumo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/encontrar-uno", async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.findOne(body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /record_consumo/sin-liquidar:
 *   get:
 *     summary: GET /sin-liquidar
 *     tags: [Record_consumo]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/sin-liquidar", async (req, res, next) => {
  try {
    const result = await service.sinLiquidar();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /record_consumo/preview-liquidacion-ruta:
 *   post:
 *     summary: POST /preview-liquidacion-ruta
 *     tags: [Record_consumo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/preview-liquidacion-ruta", async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.previewLiquidacionRuta(body);
    res.json({
      message: "Preliquidacion calculada",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /record_consumo/liquidar-ruta:
 *   post:
 *     summary: POST /liquidar-ruta
 *     tags: [Record_consumo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/liquidar-ruta", async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.liquidarRuta(body);
    res.json({
      message: "Liquidacion realizada",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /record_consumo:
 *   post:
 *     summary: Crea un registro
 *     tags: [Record_consumo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/", async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.create(body);
    res.json({
      message: "item creado",
      data: itemNuevo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /record_consumo/consultar-consumo:
 *   post:
 *     summary: POST /consultar-consumo
 *     tags: [Record_consumo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/consultar-consumo", async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.consultarConsumo(body);
    res.json({
      message: "Consulta Existosa",
      data: itemNuevo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /record_consumo/consultar-consumo:
 *   get:
 *     summary: GET /consultar-consumo
 *     tags: [Record_consumo]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/consultar-consumo", async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.consultarConsumo(body);
    res.json({
      message: "Consulta Existosa",
      data: itemNuevo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /record_consumo/liquidar:
 *   post:
 *     summary: POST /liquidar
 *     tags: [Record_consumo]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/liquidar", async (req, res, next) => {
  try {
    const body = req.body;
    const itemNuevo = await service.liquidar(body);
    res.json({
      message: "Consulta Existosa",
      data: itemNuevo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /record_consumo/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Record_consumo]
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
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const item = await service.update(id, body)
    res.json({
      message: "item actualizado",
      data: item
    })
  } catch (error) {
    next(error)
  }
});

/**
 * @swagger
 * /record_consumo/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Record_consumo]
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
  const { id } = req.params;
  try {
    const result = await service.delete(id)
    res.json(result)
  } catch (error) {
    next(error);
  }
})

module.exports = router;
