const express = require('express');
const EmpresaService = require('../../services/configuracion/empresa.service');

const router = express.Router();
const service = new EmpresaService();

// Obtener todas las empresas
router.get('/', async (req, res, next) => {
  try {
    const empresas = await service.find();
    res.json(empresas);
  } catch (error) {
    next(error);
  }
});

//http://localhost:3001/api/v1/empresa/1 
// Obtener una empresa por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const empresa = await service.findOne(id);
    res.json(empresa);
  } catch (error) {
    next(error);
  }
});

// Crear una nueva empresa
router.post('/', 
  async (req, res, next) => {
    try {
      const body = req.body;
      const nuevaEmpresa = await service.create(body);
      res.json({
        message: 'Empresa creada',
        data: nuevaEmpresa
      });
    } catch (error) {
      next(error);
    }
  }
);

// Actualizar una empresa
router.patch('/:id', 
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const empresa = await service.update(id, body);
      res.json(empresa);
    } catch (error) {
      next(error);
    }
  }
);

// Eliminar una empresa
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
