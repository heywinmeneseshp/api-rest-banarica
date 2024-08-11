const express = require('express');
const TransbordoService = require('../../services/logistica/transbordo.service.js');

const router = express.Router();
const service = new TransbordoService();

// Obtener todos los transbordos
router.get('/', async (req, res, next) => {
  try {
    const transbordos = await service.find();
    res.json(transbordos);
  } catch (error) {
    next(error);
  }
});

// Paginar transbordos
// Ejemplo: http://localhost:3000/api/v1/transbordos/paginar?offset=1&limit=4&id_contenedor_viejo=contenedor1&id_contenedor_nuevo=contenedor2
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, id_contenedor_viejo, id_contenedor_nuevo } = req.query;
    const items = await service.paginate(offset, limit, id_contenedor_viejo, id_contenedor_nuevo);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un transbordo por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const transbordo = await service.findOne(id);
    res.json(transbordo);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo transbordo
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const transbordoNuevo = await service.create(body);
    res.json({
      message: 'Transbordo creado',
      data: transbordoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un transbordo
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const transbordo = await service.update(id, body);
    res.json(transbordo);
  } catch (error) {
    next(error);
  }
});

// Eliminar un transbordo
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
