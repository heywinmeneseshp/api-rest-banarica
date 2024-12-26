const express = require('express');
const ContenedorService = require('../../services/logistica/contenedor.service.js');

const router = express.Router();
const service = new ContenedorService();

// Obtener todos los contenedores
router.get('/', async (req, res, next) => {
  try {
    const contenedores = await service.find();
    res.json(contenedores);
  } catch (error) {
    next(error);
  }
});

// Paginar contenedores
// Ejemplo: http://localhost:3000/api/v1/contenedores/paginar?offset=1&limit=4
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

// Obtener un contenedor por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const contenedor = await service.findOne(id);
    res.json(contenedor);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo contenedor
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const contenedorNuevo = await service.create(body);
    res.json({
      message: 'Contenedor creado',
      data: contenedorNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un contenedor
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const contenedor = await service.update(id, body);
    res.json(contenedor);
  } catch (error) {
    next(error);
  }
});

// Eliminar un contenedor
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
