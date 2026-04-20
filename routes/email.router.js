const express = require("express");
const passport = require('passport');

const EmailService = require('../services/email.service');


const router = express.Router();
const service = new EmailService();


router.post("/send",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.send(body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/config",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const config = await service.getEmailConfig();
    res.json([config]);
  } catch (error) {
    next(error);
  }
});



module.exports = router;
