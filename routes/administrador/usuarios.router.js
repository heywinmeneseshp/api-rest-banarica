const express = require("express");
const UsuariosService = require('../../services/usuarios.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearUsuario, actualizarUsuario, agregarAlmacenParaUsuario, actualizarUsuarioPorAlmacen } = require('../../schema/usuario.schema');

const passport = require("passport");
const { checkSuperAdminRole } = require('../../middlewares/auth.handler');

const router = express.Router();
const service = new UsuariosService();

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

router.get("/almacen", async (req, res, next) => {
  try {
    const items = await service.findAllAlmacenesassigned();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.patch("/almacen/actualizar", validatorHandler(actualizarUsuarioPorAlmacen, "body"), async (req, res, next) => {
  const { username, id_almacen, habilitado } = req.body;
  try {
    const item = await service.updateAlmacenFromUser(username, id_almacen, habilitado);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/almacen", validatorHandler(agregarAlmacenParaUsuario, "body"), async (req, res, next) => {
  const body = req.body;
  try {
    const item = await service.addAlmacenToUser(body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/almacen/cons/:id_almacen", async (req, res, next) => {
  const { id_almacen } = req.params;
  try {
    const items = await service.findUsersByAlmacen(id_almacen);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/almacen/:username", async (req, res, next) => {
  const { username } = req.params;
  try {
    const items = await service.findByUser(username);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.delete("/almacen/:username/:id_almacen", async (req, res, next) => {
  const { username, id_almacen } = req.params;
  try {
    const item = await service.deleteAlmacenFromUser(username, id_almacen);
    res.json(item);
  } catch (error) {
    next(error);
  }
});


//Crear
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
