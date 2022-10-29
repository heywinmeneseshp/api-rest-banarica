const express = require('express');

const ConfigService = require('./../services/configuracion.service');
const service = new ConfigService();



const router = express.Router();

router.get('/encontrar/:modulo',
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
  async (req, res, next) => {
    try {
      const body = req.body;
      const result = await service.update(body)
      res.json(result);
    } catch (err) {
      next(err);
    }
  });


module.exports = router;
