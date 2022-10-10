const express = require("express");
const pdf = require('html-pdf');

let pedidoTemplate = require("../documents/pedido.pdf")
let stockTemplate = require("../documents/stock.pdf")
let movimientosTemplate = require("../documents/movimientos.pdf")
let trasladoTemplate = require("../documents/traslado.pdf")

const router = express.Router();


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

router.get('/pedido', async (req, res, next) => {
  try {
    const newDirname = __dirname.replace("routes", "") + "/result.pdf"
    res.sendFile(newDirname)
  } catch(error) {
    next(error)
  }
});

///STOCK
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

router.get('/stock', async (req, res, next) => {
  try {
    const newDirname = __dirname.replace("routes", "") + "/result.pdf"
    res.sendFile(newDirname)
  } catch (error){
    next(error)
  }
});

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
