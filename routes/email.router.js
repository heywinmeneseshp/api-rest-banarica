const express = require("express");
const passport = require('passport');

const EmailService = require('../services/email.service');


const router = express.Router();
const service = new EmailService();


/**
 * @swagger
 * /email/send:
 *   post:
 *     summary: POST /send
 *     tags: [Email]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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

/**
 * @swagger
 * /email/config:
 *   get:
 *     summary: GET /config
 *     tags: [Email]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
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
