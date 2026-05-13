const express = require('express');
const passport = require('passport');

const ConfigService = require('./../services/configuracion.service');
const service = new ConfigService();



const router = express.Router();

// Endpoints usados por el modal de configuracion del frontend.

router.get('/listar',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { prefix = '' } = req.query;
      const result = await service.list(prefix);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });


router.get('/encontrar/:modulo',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { modulo } = req.params;
      const result = await service.find(modulo)
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

router.patch('/actualizar',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const body = req.body;
      const result = await service.update(body)
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

router.get('/email',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const result = await service.findEmailConfig()
      res.json([result]);
    } catch (err) {
      next(err);
    }
  });

router.patch('/email',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const body = req.body;
      const result = await service.updateEmailConfig(body)
      res.json(result);
    } catch (err) {
      next(err);
    }
  });


module.exports = router;
