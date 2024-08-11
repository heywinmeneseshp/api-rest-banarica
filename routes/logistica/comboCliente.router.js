const express = require('express');
const ComboClienteService = require('../../services/logistica/comboCliente.service.js');

const router = express.Router();
const service = new ComboClienteService();

// Obtener todos los combos clientes
router.get('/', async (req, res, next) => {
  try {
    const combosClientes = await service.find();
    res.json(combosClientes);
  } catch (error) {
    next(error);
  }
});

// Paginar combos clientes
// Ejemplo: http://localhost:3000/api/v1/comboClientes/paginar?offset=1&limit=4&id_cliente=cliente1
router.get('/paginar', async (req, res, next) => {
  try {
    const { offset, limit, id_cliente } = req.query;
    const items = await service.paginate(offset, limit, id_cliente);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Obtener un combo cliente por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const comboCliente = await service.findOne(id);
    res.json(comboCliente);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo combo cliente
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    const comboClienteNuevo = await service.create(body);
    res.json({
      message: 'Combo cliente creado',
      data: comboClienteNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un combo cliente
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const comboCliente = await service.update(id, body);
    res.json(comboCliente);
  } catch (error) {
    next(error);
  }
});

// Eliminar un combo cliente
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
