const express = require('express');
const MotivoDeRechazoService = require('../../services/logistica/motivoDeRechazo.service.js');

const router = express.Router();
const service = new MotivoDeRechazoService();

// Obtener todos los motivos de rechazo
router.get('/', async (req, res, next) => {
  try {
    const motivos = await service.find();
    res.json(motivos);
  } catch (error) {
    next(error);
  }
});

// Paginar motivos de rechazo
// Ejemplo: http://localhost:3000/api/v1/motivos-de-rechazo/paginar?offset=1&limit=4&motivo_rechazo=motivo1
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, motivo_rechazo } = req.query;
    const items = await service.paginate(offset, limit, motivo_rechazo);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un motivo de rechazo por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const motivoDeRechazo = await service.findOne(id);
    res.json(motivoDeRechazo);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo motivo de rechazo
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const motivoDeRechazoNuevo = await service.create(body);
    res.json({
      message: 'Motivo de rechazo creado',
      data: motivoDeRechazoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un motivo de rechazo
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const motivoDeRechazo = await service.update(id, body);
    res.json(motivoDeRechazo);
  } catch (error) {
    next(error);
  }
});

// Eliminar un motivo de rechazo
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
