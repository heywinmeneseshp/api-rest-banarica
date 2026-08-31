const express = require("express");

const combosService = require('../../services/combos.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearCombo, actualizarCombo, armarCombo } = require('../../schema/combo.schema');
const { checkApiKeyOrJwt } = require('../../middlewares/auth.handler');

const router = express.Router();
const service = new combosService();

// Antes público. Ahora exige login JWT (panel admin propio) o el header
// `api` para integraciones servidor-a-servidor (ej. api-rest-corbana),
// mismo criterio que almacenes/programacion-corte — ver checkApiKeyOrJwt.
/**
 * @swagger
 * /combos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Combos]
 *     description: Acepta login JWT o el header `api` con la API key.
 *     responses:
 *       200: { description: OK }
 */
router.get("/", checkApiKeyOrJwt, async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
/**
 * @swagger
 * /combos/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Combos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/paginar", async (req, res, next) => {
  try {
    const { page, limit, nombre } = req.query;
    const body = req.body;
    const items = await service.paginate(page, limit, nombre, body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /combos/listar:
 *   get:
 *     summary: GET /listar
 *     tags: [Combos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/listar", async (req, res, next) => {
  try {
    const result = await service.findAllCombos();
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }

})

/**
 * @swagger
 * /combos/listar/{id_combo}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Combos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id_combo
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/listar/:id_combo", async (req, res, next) => {
  try {
    const { id_combo } = req.params
    const result = await service.findOneCombo(id_combo);
    console.log(result)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }

})

/**
 * @swagger
 * /combos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Combos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const Items = await service.findOne(id);
    res.json(Items);
  } catch (error) {
    next(error)
  }
});



//Crear
/**
 * @swagger
 * /combos:
 *   post:
 *     summary: Crea un registro
 *     tags: [Combos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
  validatorHandler(crearCombo, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const ItemsNuevo = await service.create(body);
      res.json({
        message: "Items creado",
        data: ItemsNuevo
      })
    } catch (error) {
      next(error);
    }
  });

  //Cargue Masivo y Actualización Masiva
  /**
   * @swagger
   * /combos/masivo-actualizar:
   *   post:
   *     summary: Operacion masiva (POST)
   *     tags: [Combos]
   *     security: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { type: object }
   *     responses:
   *       200: { description: OK }
   */
  router.post("/masivo-actualizar", async (req, res, next) => {
    try { res.json(await service.bulkUpdate(req.body)); } catch (e) { next(e); }
  });

  /**
   * @swagger
   * /combos/masivo:
   *   post:
   *     summary: Operacion masiva (POST)
   *     tags: [Combos]
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
        const ItemsNuevos = await service.bulkCreate(body);
        res.json({
          message: "Items creados",
          data: ItemsNuevos
        })
      } catch (error) {
        next(error);
      }
    });
  

/**
 * @swagger
 * /combos/listar:
 *   post:
 *     summary: POST /listar
 *     tags: [Combos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/listar",
  validatorHandler(armarCombo, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const productoEnCombo = await service.armarCombo(body);
      res.json({
        message: "Items creado",
        data: productoEnCombo
      })
    } catch (error) {
      next(error);
    }
  })

//ACTUALIZACIONES PARCIALES
/**
 * @swagger
 * /combos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Combos]
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
router.patch("/:id",
  validatorHandler(actualizarCombo, "body"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const body = req.body;
      const Items = await service.update(id, body)
      res.json({
        message: 'El Items fue actualizado',
        data: Items,
        id
      })
    } catch (error) {
      next(error);
    }
  });

//ELIMINAR
/**
 * @swagger
 * /combos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Combos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete("/:id", async (req, res, next) => {
  const { id } = req.params
  try {
    const result = await service.delete(id)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

module.exports = router;
