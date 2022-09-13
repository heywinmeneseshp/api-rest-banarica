const express = require("express");
const pdf = require('html-pdf');

const PDFService = require("../services/pdf.service")
const service = new PDFService()
let pedidoTemplate = require("../documents/pedido.pdf")
let stockTemplate = require("../documents/stock.pdf")
let movimientosTemplate = require("../documents/movimientos.pdf")

const router = express.Router();


router.get('/pedido/:consecutivo', async (req, res) => {
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
})

///PEDIDO
router.post('/pedido', async (req, res) => {
  const { consecutivo } = req.body
  let htmlTemplate = await pedidoTemplate(consecutivo)
  pdf.create(htmlTemplate, {}).toFile('result.pdf', async (err) => {
    if(err) {
        res.send(await Promise.reject());
    }

    res.send(await Promise.resolve());
});
})

router.get('/pedido', async (req, res) => {
  const newDirname = __dirname.replace("routes", "") + "/result.pdf"
  res.sendFile(newDirname)
});

///STOCK
router.post('/stock', async (req, res) => {
  const body = req.body
  let htmlTemplate = await stockTemplate(body)
  pdf.create(htmlTemplate, {}).toFile('result.pdf', async (err) => {
    if(err) {
        res.send(await Promise.reject());
    }

    res.send(await Promise.resolve());
});
})

router.get('/stock', async (req, res) => {
  const newDirname = __dirname.replace("routes", "") + "/result.pdf"
  res.sendFile(newDirname)
});

router.get('/movimiento/:consecutivo/:tipo_movimiento', async (req, res) => {
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
})



module.exports = router;
