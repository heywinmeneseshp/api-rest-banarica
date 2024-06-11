const express = require("express");

const EmailService = require('../services/email.service');


const router = express.Router();
const service = new EmailService();


router.post("/send", async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.send(body.destinatario, body.asunto, body.cuerpo);
    res.json(items);
  } catch (error) {
    next(error);
  }
});



module.exports = router;
