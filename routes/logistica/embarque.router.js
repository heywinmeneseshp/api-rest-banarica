const express = require('express');
const EmbarqueService = require('../../services/logistica/embarque.service.js');

const router = express.Router();
const service = new EmbarqueService();

// Obtener todos los embarques
router.get('/', async (req, res, next) => {
  try {
    const embarques = await service.find();
    res.json(embarques);
  } catch (error) {
    next(error);
  }
});

// Paginar embarques
// Ejemplo: http://localhost:3000/api/v1/embarques/paginar?offset=1&limit=4&filters={"nombre":"embarque1"}
router.post('/paginar', async (req, res, next) => {
  try {
    const { offset, limit} = req.query;
    const body = req.body || {};
    const items = await service.paginate(offset, limit, body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un embarque por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const embarque = await service.findOne(id);
    res.json(embarque);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo embarque
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const embarqueNuevo = await service.create(body);
    res.json({
      message: 'Embarque creado',
      data: embarqueNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Crear embarques masivos
router.post('/masivo', async (req, res, next) => {
  try {
    const body = req.body;
    const embarqueNuevo = await service.cargueMasivo(body);
    res.json({
      message: 'Embarques creados',
      data: embarqueNuevo
    });
  } catch (error) {
    next(error);
  }
});

router.post('/actualizar-masivo', async (req, res, next) => {
  try {
    const body = req.body;
    const embarqueNuevo = await service.actualizarMasivo(body);
    res.json({
      message: 'Embarques creados',
      data: embarqueNuevo
    });
  } catch (error) {
    next(error);
  }
});


// Actualizar un embarque
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const embarque = await service.update(id, body);
    res.json(embarque);
  } catch (error) {
    next(error);
  }
});

// Eliminar un embarque
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
