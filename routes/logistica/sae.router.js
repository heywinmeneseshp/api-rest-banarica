const express = require('express');
const SAEService = require('../../services/logistica/sae.service.js');

const router = express.Router();
const service = new SAEService();

// Obtener todas las SAEs
router.get('/', async (req, res, next) => {
  try {
    const saes = await service.find();
    res.json(saes);
  } catch (error) {
    next(error);
  }
});

// Paginar SAEs
// Ejemplo: http://localhost:3000/api/v1/saes/paginar?offset=1&limit=4&sae=SAE1
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, sae } = req.query;
    const items = await service.paginate(offset, limit, sae);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener una SAE por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const sae = await service.findOne(id);
    res.json(sae);
  } catch (error) {
    next(error);
  }
});

// Crear una nueva SAE
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const saeNuevo = await service.create(body);
    res.json({
      message: 'SAE creada',
      data: saeNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar una SAE
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const sae = await service.update(id, body);
    res.json(sae);
  } catch (error) {
    next(error);
  }
});

// Eliminar una SAE
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
