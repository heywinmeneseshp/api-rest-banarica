const express = require("express");
const pdf = require('html-pdf');

const PDFService = require("../services/pdf.service")
const service = new PDFService()
let pedidoTemplate = require("../documents/pedido.pdf")

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
  console.log(__dirname)
  const newDirname = __dirname.replace("routes", "") + "/result.pdf"
  res.sendFile(newDirname)
  service.delete(newDirname)
});



module.exports = router;
