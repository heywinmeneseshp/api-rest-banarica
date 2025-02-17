const express = require('express');
const RechazoService = require('../../services/logistica/rechazo.service.js');

const router = express.Router();
const service = new RechazoService();

// Obtener todos los rechazos
router.get('/', async (req, res, next) => {
  try {
    const rechazos = await service.find();
    res.json(rechazos);
  } catch (error) {
    next(error);
  }
});

// Paginar rechazos
// Ejemplo: http://localhost:3000/api/v1/rechazos/paginar?offset=1&limit=4&id_producto=123
router.post('/paginar', async (req, res, next) => {
  try {
    const { offset, limit } = req.query;
    const body = req.body;
    const items = await service.paginate(offset, limit, body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un rechazo por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const rechazo = await service.findOne(id);
    res.json(rechazo);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo rechazo
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const rechazoNuevo = await service.create(body);
    res.json({
      message: 'Rechazo creado',
      data: rechazoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un rechazo
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const rechazo = await service.update(id, body);
    res.json(rechazo);
  } catch (error) {
    next(error);
  }
});

// Eliminar un rechazo
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
