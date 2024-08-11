const express = require('express');
const ListadoService = require('../../services/logistica/listado.service.js');

const router = express.Router();
const service = new ListadoService();

// Obtener todos los listados
router.get('/', async (req, res, next) => {
  try {
    const listados = await service.find();
    res.json(listados);
  } catch (error) {
    next(error);
  }
});

// Paginar listados
// Ejemplo: http://localhost:3000/api/v1/listados/paginar?offset=1&limit=4&filters={"nombre":"listado1"}
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, filters } = req.query;
    const filterObject = filters ? JSON.parse(filters) : {};
    const items = await service.paginate(offset, limit, filterObject);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un listado por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const listado = await service.findOne(id);
    res.json(listado);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo listado
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const listadoNuevo = await service.create(body);
    res.json({
      message: 'Listado creado',
      data: listadoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un listado
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const listado = await service.update(id, body);
    res.json(listado);
  } catch (error) {
    next(error);
  }
});

// Eliminar un listado
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
