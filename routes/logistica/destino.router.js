const express = require('express');
const DestinoService = require('../../services/logistica/destino.service.js');

const router = express.Router();
const service = new DestinoService();

// Obtener todos los destinos
router.get('/', async (req, res, next) => {
  try {
    const destinos = await service.find();
    res.json(destinos);
  } catch (error) {
    next(error);
  }
});

// Paginar destinos
// Ejemplo: http://localhost:3000/api/v1/destinos/paginar?offset=1&limit=4&destino=destino1
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, destino } = req.query;
    const items = await service.paginate(offset, limit, destino);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un destino por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const destino = await service.findOne(id);
    res.json(destino);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo destino
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const destinoNuevo = await service.create(body);
    res.json({
      message: 'Destino creado',
      data: destinoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un destino
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const destino = await service.update(id, body);
    res.json(destino);
  } catch (error) {
    next(error);
  }
});

// Eliminar un destino
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
