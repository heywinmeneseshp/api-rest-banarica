const express = require('express');
const passport = require('passport');
const { checkApiKeyOrJwt } = require('../../middlewares/auth.handler');
const ProgramacionCorteService = require('../../services/logistica/programacionCorte.service');

const router = express.Router();
const service = new ProgramacionCorteService();

// GET / acepta el header `api` (integraciones servidor-a-servidor, ej.
// api-rest-corbana) además del login JWT normal — ver checkApiKeyOrJwt.
router.get('/', checkApiKeyOrJwt, async (req, res, next) => {
  try {
    const items = await service.listar();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/cargar', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const resultado = await service.cargar(req.body.filas, req.body.semana);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.get('/comparativa', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const resultado = await service.comparativa(req.query.semana);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/listado-relacionado', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const resultado = await service.lineasListadoRelacionadas(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const result = await service.eliminar(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;