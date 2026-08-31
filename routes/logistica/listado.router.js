const express = require('express');
const passport = require('passport');
const ListadoService = require('../../services/logistica/listado.service.js');

const router = express.Router();
const service = new ListadoService();

// Obtener todos los listados
/**
 * @swagger
 * /listado:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Listado]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res, next) => {
  try {
    const listados = await service.find();
    res.json(listados);
  } catch (error) {
    next(error);
  }
});

// Contar contenedores únicos con los mismos filtros que paginar
/**
 * @swagger
 * /listado/contar-unicos:
 *   post:
 *     summary: POST /contar-unicos
 *     tags: [Listado]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/contar-unicos', async (req, res, next) => {
  try {
    const result = await service.countUniqueContainers(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Paginar listados
// Ejemplo: http://localhost:3000/api/v1/listados/paginar?offset=1&limit=4
/**
 * @swagger
 * /listado/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Listado]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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

// Historial general (filtrable), util para consultar que habia antes de una
// eliminacion ya que la fila deja de existir en Listado (hard delete).
// Debe ir antes de "/:id" para que Express no lo confunda con un id.
/**
 * @swagger
 * /listado/historial/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Listado]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/historial/paginar', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await service.paginarHistorial(page, limit, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /listado/{id}/historial:
 *   get:
 *     summary: GET /:id/historial
 *     tags: [Listado]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/:id/historial', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.historialPorId(id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

// Obtener un listado por ID
/**
 * @swagger
 * /listado/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Listado]
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
    const listado = await service.findOne(id);
    res.json(listado);
  } catch (error) {
    next(error);
  }
});

//duplicar linea
/**
 * @swagger
 * /listado/duplicar/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Listado]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/duplicar/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const listado = await service.duplicarListado(id);
    res.json(listado);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo listado
/**
 * @swagger
 * /listado:
 *   post:
 *     summary: Crea un registro
 *     tags: [Listado]
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
    const listadoNuevo = await service.create(body);
    res.json({
      message: 'Listado creado',
      data: listadoNuevo
    });
  } catch (error) {
    next(error);
  }
});

//Cargar Listado masivo
/**
 * @swagger
 * /listado/masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Listado]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/masivo', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const body = req.body;
    const listadoNuevo = await service.bulkCreate(body, req.user?.username);
    res.json({
      message: 'Listado creado',
      data: listadoNuevo
    });
  } catch (error) {
    next(error);
  }
});

//Actualizar Listado masivo
/**
 * @swagger
 * /listado/actualizar-masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Listado]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/actualizar-masivo', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const body = req.body;
    const listadoNuevo = await service.bulkUpdate(body, req.user?.username);
    res.json({
      message: 'Listado creado',
      data: listadoNuevo
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un listado
/**
 * @swagger
 * /listado/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Listado]
 *     security: [{ bearerAuth: [] }]
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
router.patch('/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const listado = await service.update(id, body, req.user?.username);
    res.json(listado);
  } catch (error) {
    next(error);
  }
});

// Eliminar un listado
/**
 * @swagger
 * /listado/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Listado]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.delete(id, req.user?.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});



// ─── Exporte plano para Excel (optimizado, sin joins complejos) ───
/**
 * @swagger
 * /listado/exportar:
 *   post:
 *     summary: POST /exportar
 *     tags: [Listado]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/exportar', async (req, res, next) => {
  try {
    const { offset, limit } = req.query;
    const body = req.body;
    const items = await service.exportExcel(offset, limit, body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
