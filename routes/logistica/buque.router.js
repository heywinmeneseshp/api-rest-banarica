const express = require('express');
const BuqueService = require('../../services/logistica/buque.service.js');

const router = express.Router();
const service = new BuqueService();

// Obtener todos los buques
router.get('/', async (req, res, next) => {
  try {
    const buques = await service.find();
    res.json(buques);
  } catch (error) {
    next(error);
  }
});

// Paginar buques
// Ejemplo: http://localhost:3000/api/v1/buques/paginar?offset=1&limit=4&nombre=buque1
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, buque } = req.query;
    const items = await service.paginate(offset, limit, buque);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un buque por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const buque = await service.findOne(id);
    res.json(buque);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo buque
router.post('/', 
  async (req, res, next) => {
    try {
      const body = req.body;
      const buqueNuevo = await service.create(body);
      res.json({
        message: 'Buque creado',
        data: buqueNuevo
      });
    } catch (error) {
      next(error);
    }
  }
);

// Actualizar un buque
router.patch('/:id', 
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const buque = await service.update(id, body);
      res.json(buque);
    } catch (error) {
      next(error);
    }
  }
);

// Eliminar un buque
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
