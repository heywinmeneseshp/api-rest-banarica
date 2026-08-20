const express = require("express");

const AlmacenesService = require("./../../services/almacenes.service");
const validatorHandler = require('./../../middlewares/validator.handler');
const { crearAlmacen, actualizarAlmacen } = require('./../../schema/almacen.schema');
const { checkApiKeyOrJwt } = require('./../../middlewares/auth.handler');

const router = express.Router();
const service = new AlmacenesService();

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


router.get("/:consecutivo", async (req, res, next) => {
  try {
    const { consecutivo } = req.params;
    const result = await service.findOne(consecutivo);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

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

router.post("/masivo-actualizar", async (req, res, next) => {
  try {
    const result = await service.bulkUpdate(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

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
