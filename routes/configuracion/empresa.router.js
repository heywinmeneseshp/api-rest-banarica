const express = require('express');
const passport = require('passport');
const EmpresaService = require('../../services/configuracion/empresa.service');

const router = express.Router();
const service = new EmpresaService();

// Obtener todas las empresas
/**
 * @swagger
 * /empresa:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Empresa]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /empresa/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Empresa]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /empresa:
 *   post:
 *     summary: Crea un registro
 *     tags: [Empresa]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/', async (req, res, next) => {
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
});

// Actualizar una empresa
/**
 * @swagger
 * /empresa/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Empresa]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const empresa = await service.update(id, body);
    res.json(empresa);
  } catch (error) {
    next(error);
  }
});

// Eliminar una empresa
/**
 * @swagger
 * /empresa/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Empresa]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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
