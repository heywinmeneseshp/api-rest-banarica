const express = require('express');
const motivoDeUsoService = require('../../services/seguridad/motivoDeUso.service');

const router = express.Router();
const service = new motivoDeUsoService();

// Obtener todas las motivoDeUsoS
router.get('/', async (req, res, next) => {
  try {
    const motivoDeUsoS = await service.find();
    res.json(motivoDeUsoS);
  } catch (error) {
    next(error);
  }
});

// Paginar motivoDeUsoS
// Ejemplo: http://localhost:3000/api/v1/motivoDeUso/paginar?offset=1&limit=4&MotivoDeUso=SAE1
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, MotivoDeUso } = req.query;
    const items = await service.paginate(offset, limit, MotivoDeUso);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener una SAE por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const motivo = await service.findOne(id);
    res.json(motivo);
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
      message: 'Motivo de uso creado',
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
    const motivo = await service.update(id, body);
    res.json(motivo);
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
