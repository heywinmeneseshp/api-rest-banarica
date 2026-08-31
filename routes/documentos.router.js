const express = require("express");
const pdf = require('html-pdf');

let pedidoTemplate = require("../documents/pedido.pdf")
let stockTemplate = require("../documents/stock.pdf")
let movimientosTemplate = require("../documents/movimientos.pdf")
let trasladoTemplate = require("../documents/traslado.pdf")

const router = express.Router();


/**
 * @swagger
 * /documentos/pedido/{consecutivo}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Documentos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: consecutivo
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/pedido/:consecutivo', async (req, res, next) => {
  try {
    const { consecutivo } = req.params
    let htmlTemplate = await pedidoTemplate(consecutivo)
    pdf.create(htmlTemplate).toStream((error, stream) => {
      if (error) {
        res.end("Error creando PDF: " + error)
      } else {
        res.setHeader("Content-Type", "application/pdf");
        stream.pipe(res);
      }
    });
  } catch(error) {
    next(error)
  }
})

///PEDIDO
/**
 * @swagger
 * /documentos/pedido:
 *   post:
 *     summary: POST /pedido
 *     tags: [Documentos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/pedido', async (req, res, next) => {
  try {
    const { consecutivo } = req.body
    let htmlTemplate = await pedidoTemplate(consecutivo)
    pdf.create(htmlTemplate, {}).toFile('result.pdf', async (err) => {
      if (err) {
        res.send(await Promise.reject());
      }

      res.send(await Promise.resolve());
    });
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /documentos/pedido:
 *   get:
 *     summary: GET /pedido
 *     tags: [Documentos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/pedido', async (req, res, next) => {
  try {
    const newDirname = __dirname.replace("routes", "") + "/result.pdf"
    res.sendFile(newDirname)
  } catch(error) {
    next(error)
  }
});

///STOCK
/**
 * @swagger
 * /documentos/stock:
 *   post:
 *     summary: POST /stock
 *     tags: [Documentos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/stock', async (req, res, next) => {
  try {
    const body = req.body
    let htmlTemplate = await stockTemplate(body)
    pdf.create(htmlTemplate, {}).toFile('result.pdf', async (err) => {
      if (err) {
        res.send(await Promise.reject());
      }

      res.send(await Promise.resolve());
    });
  } catch (error){
    next(error)
  }
})

/**
 * @swagger
 * /documentos/stock:
 *   get:
 *     summary: GET /stock
 *     tags: [Documentos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/stock', async (req, res, next) => {
  try {
    const newDirname = __dirname.replace("routes", "") + "/result.pdf"
    res.sendFile(newDirname)
  } catch (error){
    next(error)
  }
});

/**
 * @swagger
 * /documentos/traslado/{consecutivo}:
 *   get:
 *     summary: GET /traslado/:consecutivo/
 *     tags: [Documentos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: consecutivo
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/traslado/:consecutivo/', async (req, res, next) => {
  try {
    const { consecutivo } = req.params
    let htmlTemplate = await trasladoTemplate(consecutivo)
    pdf.create(htmlTemplate).toStream((error, stream) => {
      if (error) {
        res.end("Error creando PDF: " + error)
      } else {
        res.setHeader("Content-Type", "application/pdf");
        stream.pipe(res);
      }
    });
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /documentos/movimiento/{consecutivo}/{tipo_movimiento}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Documentos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: consecutivo
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: tipo_movimiento
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/movimiento/:consecutivo/:tipo_movimiento', async (req, res, next) => {
  try {
    const { consecutivo, tipo_movimiento } = req.params
    let htmlTemplate = await movimientosTemplate(consecutivo, tipo_movimiento)
    pdf.create(htmlTemplate).toStream((error, stream) => {
      if (error) {
        res.end("Error creando PDF: " + error)
      } else {
        res.setHeader("Content-Type", "application/pdf");
        stream.pipe(res);
      }
    });
  } catch (error) {
    next(error)
  }
})



module.exports = router;
