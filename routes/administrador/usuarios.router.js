const express = require("express");
const UsuariosService = require('../../services/usuarios.service');
const validatorHandler = require('../../middlewares/validator.handler');
const {
  crearUsuario,
  actualizarUsuario,
  agregarAlmacenParaUsuario,
  actualizarUsuarioPorAlmacen,
  agregarTransportadoraParaUsuario,
  actualizarUsuarioPorTransportadora
} = require('../../schema/usuario.schema');

const passport = require("passport");
const { checkSuperAdminRole } = require('../../middlewares/auth.handler');

const router = express.Router();
const service = new UsuariosService();

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get("/",
  passport.authenticate('jwt', { session: false }),
  checkSuperAdminRole,
  async (req, res, next) => {
    try {
      const items = await service.find();
      res.send(items);
    } catch (error) {
      next(error);
    }
  });
// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
/**
 * @swagger
 * /usuarios/paginar:
 *   get:
 *     summary: Pagina y filtra registros
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get("/paginar",
  passport.authenticate('jwt', { session: false }),
  checkSuperAdminRole,
  async (req, res, next) => {
    try {
      const { page, limit, username } = req.query;
      const items = await service.paginate(page, limit, username);
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

/**
 * @swagger
 * /usuarios/almacen:
 *   get:
 *     summary: GET /almacen
 *     tags: [Usuarios]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/almacen", async (req, res, next) => {
  try {
    const items = await service.findAllAlmacenesassigned();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/almacen/actualizar:
 *   patch:
 *     summary: PATCH /almacen/actualizar
 *     tags: [Usuarios]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.patch("/almacen/actualizar", validatorHandler(actualizarUsuarioPorAlmacen, "body"), async (req, res, next) => {
  const { username, id_almacen, habilitado } = req.body;
  try {
    const item = await service.updateAlmacenFromUser(username, id_almacen, habilitado);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/almacen:
 *   post:
 *     summary: POST /almacen
 *     tags: [Usuarios]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/almacen", validatorHandler(agregarAlmacenParaUsuario, "body"), async (req, res, next) => {
  const body = req.body;
  try {
    const item = await service.addAlmacenToUser(body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/almacen/cons/{id_almacen}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Usuarios]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id_almacen
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/almacen/cons/:id_almacen", async (req, res, next) => {
  const { id_almacen } = req.params;
  try {
    const items = await service.findUsersByAlmacen(id_almacen);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/almacen/{username}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Usuarios]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/almacen/:username", async (req, res, next) => {
  const { username } = req.params;
  try {
    const items = await service.findByUser(username);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/almacen/{username}/{id_almacen}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Usuarios]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id_almacen
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete("/almacen/:username/:id_almacen", async (req, res, next) => {
  const { username, id_almacen } = req.params;
  try {
    const item = await service.deleteAlmacenFromUser(username, id_almacen);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/transportadora:
 *   get:
 *     summary: GET /transportadora
 *     tags: [Usuarios]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/transportadora", async (req, res, next) => {
  try {
    const items = await service.findAllTransportadorasAssigned();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/transportadora/actualizar:
 *   patch:
 *     summary: PATCH /transportadora/actualizar
 *     tags: [Usuarios]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.patch("/transportadora/actualizar", validatorHandler(actualizarUsuarioPorTransportadora, "body"), async (req, res, next) => {
  const { username, id_transportadora, habilitado } = req.body;
  try {
    const item = await service.updateTransportadoraFromUser(username, id_transportadora, habilitado);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/transportadora:
 *   post:
 *     summary: POST /transportadora
 *     tags: [Usuarios]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/transportadora", validatorHandler(agregarTransportadoraParaUsuario, "body"), async (req, res, next) => {
  const body = req.body;
  try {
    const item = await service.addTransportadoraToUser(body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/transportadora/cons/{id_transportadora}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Usuarios]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id_transportadora
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/transportadora/cons/:id_transportadora", async (req, res, next) => {
  const { id_transportadora } = req.params;
  try {
    const items = await service.findUsersByTransportadora(id_transportadora);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/transportadora/{username}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Usuarios]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/transportadora/:username", async (req, res, next) => {
  const { username } = req.params;
  try {
    const items = await service.findTransportadorasByUser(username);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios/transportadora/{username}/{id_transportadora}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Usuarios]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id_transportadora
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete("/transportadora/:username/:id_transportadora", async (req, res, next) => {
  const { username, id_transportadora } = req.params;
  try {
    const item = await service.deleteTransportadoraFromUser(username, id_transportadora);
    res.json(item);
  } catch (error) {
    next(error);
  }
});


//Crear
/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crea un registro
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/",
  passport.authenticate('jwt', { session: false }),
  checkSuperAdminRole,
  validatorHandler(crearUsuario, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const itemNuevo = await service.create(body);
      res.json({
        message: "item creado",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }

  });

/**
 * @swagger
 * /usuarios/{username}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Usuarios]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/:username", async (req, res, next) => {
  const { username } = req.params;
  try {
    const item = await service.findOne(username);
    res.json(item);
  } catch (error) {
    next(error)
  }
});


//ACTUALIZACIONES PARCIALES
/**
 * @swagger
 * /usuarios/{username}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.patch("/:username",
  passport.authenticate('jwt', { session: false }),
  validatorHandler(actualizarUsuario, "body"),
  async (req, res, next) => {
    try {
      const { username } = req.params
      const body = req.body;
      const item = await service.update(username, body)
      res.json({
        message: 'El item fue actualizado',
        data: item,
        username
      })
    } catch (error) {
      next(error);
    }
  });



//ELIMINAR
/**
 * @swagger
 * /usuarios/{username}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete("/:username",
  passport.authenticate('jwt', { session: false }),
  checkSuperAdminRole,
  async (req, res, next) => {
    const { username } = req.params
    try {
      const result = await service.delete(username)
      res.json(result)
    } catch (error) {
      next(error);
    }
  });

module.exports = router;
