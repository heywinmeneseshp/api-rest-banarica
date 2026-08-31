const express = require("express");

const PedidosService = require('../services/pedidos.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearPedido, editarPedido, ingresarConsPedido, recibirPedido } = require('../schema/pedido.schema');


const router = express.Router();
const service = new PedidosService();

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Pedidos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res, next) => {
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
 * /pedidos/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Pedidos]
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
    const { page, limit, almacen, cons_categoria, producto, semana } = req.body;
    const items = await service.paginate(page, limit, almacen, cons_categoria, producto, semana);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

//Listar consecutivos de pedidos
/**
 * @swagger
 * /pedidos/listar:
 *   get:
 *     summary: GET /listar
 *     tags: [Pedidos]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/listar", async (req, res, next) => {
  try {
    const items = await service.findAllCons();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /pedidos/listar/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Pedidos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/listar/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const items = await service.findOneCons(id);
    res.json(items);
  } catch (error) {
    next(error);
  }
});


/**
 * @swagger
 * /pedidos/listar:
 *   post:
 *     summary: POST /listar
 *     tags: [Pedidos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/listar",
  validatorHandler(ingresarConsPedido, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const itemNuevo = await service.createCons(body);
      res.json({
        message: "item creado",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }
  });

//ACTUALIZACIONES PARCIALES
/**
 * @swagger
 * /pedidos/listar/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Pedidos]
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
router.patch("/listar/:id",
  validatorHandler(recibirPedido, "body"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const body = req.body;
      const item = await service.receiveOrder(id, body)
      res.json({
        message: 'El item fue actualizado',
        data: item,
        id
      })
    } catch (error) {
      next(error);
    }
  });

/**
 * @swagger
 * /pedidos/listar/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Pedidos]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete("/listar/:id", async (req, res, next) => {
  const { id } = req.params
  try {
    const result = await service.deleteCons(id)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /pedidos/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Pedidos]
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
    const item = await service.findOne(id);
    res.json(item);
  } catch (error) {
    next(error)
  }
});

//Crear
/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Crea un registro
 *     tags: [Pedidos]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
  validatorHandler(crearPedido, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      console.log(body)
      const itemNuevo = await service.create(body);
      res.json({
        message: "item creado",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }
  });


//ACTUALIZACIONES PARCIALES
/**
 * @swagger
 * /pedidos/{id}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Pedidos]
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
  validatorHandler(editarPedido, "body"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const body = req.body;
      const item = await service.update(id, body)
      res.json({
        message: 'El item fue actualizado',
        data: item,
        id
      })
    } catch (error) {
      next(error);
    }
  });

//ELIMINAR
/**
 * @swagger
 * /pedidos/{id}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Pedidos]
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
