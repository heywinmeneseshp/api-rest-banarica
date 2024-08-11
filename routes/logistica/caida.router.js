const express = require('express');
const CaidaService = require('../../services/logistica/caida.service.js');

const router = express.Router();
const service = new CaidaService();

// Obtener todos los registros de caída
router.get('/', async (req, res, next) => {
  try {
    const caidas = await service.find();
    res.json(caidas);
  } catch (error) {
    next(error);
  }
});

// Paginar registros de caída
// Ejemplo: http://localhost:3000/api/v1/caidas/paginar?offset=1&limit=4&cod_almacen=almacen1
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, cod_almacen } = req.query;
    const items = await service.paginate(offset, limit, cod_almacen);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un registro de caída por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const caida = await service.findOne(id);
    res.json(caida);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo registro de caída
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const caidaNuevo = await service.create(body);
    res.json({
      message: 'Registro de caída creado',
      data: caidaNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un registro de caída
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const caida = await service.update(id, body);
    res.json(caida);
  } catch (error) {
    next(error);
  }
});

// Eliminar un registro de caída
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
