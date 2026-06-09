const express = require('express');
const passport = require('passport');
const ProgramacionSerialesService = require('../../services/transporte/programacionSeriales.service');

const router = express.Router();
const service = new ProgramacionSerialesService();

router.get('/', async (req, res, next) => {
  try {
    const result = await service.findAll(req.query || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/paginar', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await service.paginate(page, limit, req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/masivo',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const result = await service.bulkCreate(req.body, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/vincular-contenedores',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const result = await service.vincularContenedores(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const result = await service.create(req.body, req.user);
    res.json({
      message: 'Relacion programacion-serial creada',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.update(id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.delete(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
