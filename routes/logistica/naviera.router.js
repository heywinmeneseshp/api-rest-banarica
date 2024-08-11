const express = require('express');
const NavieraService = require('../../services/logistica/naviera.service.js');

const router = express.Router();
const service = new NavieraService();

// Obtener todas las navieras
router.get('/', async (req, res, next) => {
  try {
    const navieras = await service.find();
    res.json(navieras);
  } catch (error) {
    next(error);
  }
});

// Paginar navieras
// Ejemplo: http://localhost:3000/api/v1/navieras/paginar?offset=1&limit=4&navieras=naviera1
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, navieras } = req.query;
    const items = await service.paginate(offset, limit, navieras);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener una naviera por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const naviera = await service.findOne(id);
    res.json(naviera);
  } catch (error) {
    next(error);
  }
});

// Crear una nueva naviera
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const navieraNueva = await service.create(body);
    res.json({
      message: 'Naviera creada',
      data: navieraNueva
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar una naviera
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const naviera = await service.update(id, body);
    res.json(naviera);
  } catch (error) {
    next(error);
  }
});

// Eliminar una naviera
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.delete(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
