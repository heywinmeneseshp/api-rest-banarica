const express = require("express");

const UsuariosService = require('../../services/usuarios.service');
const validatorHandler = require('../../middlewares/validator.handler');
const { crearUsuario, actualizarUsuario, agregarAlmacenParaUsuario, actualizarUsuarioPorAlmacen } = require('../../schema/usuario.schema');


const router = express.Router();
const service = new UsuariosService();

router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.send(items);
  } catch (error) {
    next(error);
  }
});

router.get("/almacen", async (req, res, next) => {
  try {
    const items = await service.findAllAlmacenesassigned ();
    res.json(items);
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

router.get("/almacen/:username/:id_almacen", async (req, res, next) => {
  const { username, id_almacen } = req.params;
  try {
    const items = await service.findAlmacenByUser(username, id_almacen);
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


router.patch("/almacen/:username/:id_almacen", validatorHandler(actualizarUsuarioPorAlmacen), async (req, res, next) => {
  const { username, id_almacen } = req.params;
  try {
    const item = await service.updateAlmacenFromUser(username, id_almacen);
    res.json(item);
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
router.delete("/:username", async (req, res, next) => {
  const { username } = req.params
  try {
    const result = await service.delete(username)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

module.exports = router;
