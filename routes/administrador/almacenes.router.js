const express = require("express");

const AlmacenesService = require("./../../services/almacenes.service");
const validatorHandler = require('./../../middlewares/validator.handler');
const { crearAlmacen, actualizarAlmacen } = require('./../../schema/almacen.schema');
const { checkApiKeyOrJwt } = require('./../../middlewares/auth.handler');

const router = express.Router();
const service = new AlmacenesService();

/**
 * @swagger
 * tags:
 *   name: Almacenes
 *   description: Catalogo de almacenes/lugares de llenado
 */

/**
 * @swagger
 * /almacenes:
 *   get:
 *     summary: Lista todos los almacenes
 *     tags: [Almacenes]
 *     description: Acepta login JWT normal o el header `api` con la API key (integraciones servidor-a-servidor, ej. api-rest-corbana).
 *     responses:
 *       200: { description: Lista completa de almacenes }
 */
// Antes público (cualquiera podía listar almacenes sin autenticarse). Ahora
// exige login JWT (como ya hace el panel admin propio, que manda el token
// automático tras iniciar sesión) o el header `api` para integraciones
// servidor-a-servidor (ej. api-rest-corbana) — ver checkApiKeyOrJwt.
router.get("/", checkApiKeyOrJwt, async (req, res, next) => {
  try {
    const result = await service.find();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /almacenes/paginar:
 *   get:
 *     summary: Pagina y filtra almacenes por nombre
 *     tags: [Almacenes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: almacen
 *         schema: { type: string }
 *         description: Texto de busqueda por nombre
 *     responses:
 *       200: { description: Pagina de resultados }
 */
// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
router.get("/paginar", async (req, res, next) => {
  try {
    const { page, limit, almacen } = req.query;
    const items = await service.paginate(page, limit, almacen);
    res.json(items);
  } catch (error) {
    next(error);
  }
});


/**
 * @swagger
 * /almacenes/{consecutivo}:
 *   get:
 *     summary: Trae un almacen por consecutivo
 *     tags: [Almacenes]
 *     parameters:
 *       - in: path
 *         name: consecutivo
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: El almacen encontrado }
 */
router.get("/:consecutivo", async (req, res, next) => {
  try {
    const { consecutivo } = req.params;
    const result = await service.findOne(consecutivo);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /almacenes:
 *   post:
 *     summary: Crea un almacen
 *     tags: [Almacenes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               consecutivo: { type: string }
 *               nombre: { type: string }
 *               razon_social: { type: string }
 *               direccion: { type: string }
 *               telefono: { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: Almacen creado }
 */
router.post("/",
  checkApiKeyOrJwt,
  validatorHandler(crearAlmacen, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const almacenNuevo = await service.create(body);
      res.json({
        message: "Almacen creado",
        data: almacenNuevo
      })
    } catch (error) {
      next(error);
    }
  });


  /**
   * @swagger
   * /almacenes/masivo:
   *   post:
   *     summary: Operacion masiva (POST)
   *     tags: [Almacenes]
   *     security: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { type: object }
   *     responses:
   *       200: { description: OK }
   */
  router.post("/masivo",
    async (req, res, next) => {
      try {
        const body = req.body;
        const almacenNuevo = await service.bulkCreate(body);
        res.json({
          message: "Almacen creado",
          data: almacenNuevo
        })
      } catch (error) {
        next(error);
      }
    });

/**
 * @swagger
 * /almacenes/masivo-actualizar:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Almacenes]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/masivo-actualizar", async (req, res, next) => {
  try {
    const result = await service.bulkUpdate(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /almacenes/{consecutivo}:
 *   patch:
 *     summary: Actualiza un almacen (parcial)
 *     tags: [Almacenes]
 *     parameters:
 *       - in: path
 *         name: consecutivo
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               razon_social: { type: string }
 *               direccion: { type: string }
 *     responses:
 *       200: { description: Almacen actualizado }
 */
router.patch("/:consecutivo",
  validatorHandler(actualizarAlmacen, "body"),
  async (req, res, next) => {
    try {
      const { consecutivo } = req.params;
      const body = req.body;
      await service.update(consecutivo, body)
      res.json({
        message: "Almacen actualizado",
        data: body
      })
    } catch (error) {
      next(error)
    }
  });

/**
 * @swagger
 * /almacenes/{consecutivo}:
 *   delete:
 *     summary: Elimina un almacen
 *     tags: [Almacenes]
 *     parameters:
 *       - in: path
 *         name: consecutivo
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Almacen eliminado }
 */
router.delete("/:consecutivo", async (req, res, next) => {
  const { consecutivo } = req.params;
  try {
    const result = await service.delete(consecutivo)
    res.json(result)
  } catch (error) {
    next(error);
  }
})

module.exports = router;
