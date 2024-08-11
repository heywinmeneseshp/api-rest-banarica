const express = require('express');
const InspeccionService = require('../../services/logistica/inspeccion.service.js');

const router = express.Router();
const service = new InspeccionService();

// Obtener todas las inspecciones
router.get('/', async (req, res, next) => {
  try {
    const inspecciones = await service.find();
    res.json(inspecciones);
  } catch (error) {
    next(error);
  }
});

// Paginar inspecciones
// Ejemplo: http://localhost:3000/api/v1/inspecciones/paginar?offset=1&limit=4&filters={"nombre":"inspeccion1"}
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

// Obtener una inspección por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const inspeccion = await service.findOne(id);
    res.json(inspeccion);
  } catch (error) {
    next(error);
  }
});

// Crear una nueva inspección
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const inspeccionNueva = await service.create(body);
    res.json({
      message: 'Inspección creada',
      data: inspeccionNueva
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar una inspección
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const inspeccion = await service.update(id, body);
    res.json(inspeccion);
  } catch (error) {
    next(error);
  }
});

// Eliminar una inspección
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
