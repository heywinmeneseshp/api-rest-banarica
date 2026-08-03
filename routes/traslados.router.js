const express = require("express");
const TrasladosService = require('../services/traslados.service');
const validatorHandler = require('../middlewares/validator.handler');
const { realizarTraslado, modificarTraslado, recibirTraslado, ejecutarTraslado } = require('../schema/traslado.schema');


const router = express.Router();
const service = new TrasladosService();

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
router.post("/paginar", async (req, res, next) => {
  try {
    const { almacenes } = req.body;
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit, almacenes);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/filter", async (req, res, next) => {
  try {
    const body = req.body;
    const items = await service.filter(body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/ejecutar",
  validatorHandler(ejecutarTraslado, "body"),
  async (req, res, next) => {
    try {
      const result = await service.executeTransfer(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

router.post("/pendiente",
  validatorHandler(ejecutarTraslado, "body"),
  async (req, res, next) => {
    try {
      const result = await service.crearPendiente(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

router.get("/pendientes/listar", async (req, res, next) => {
  try {
    const almacenes = String(req.query.almacenes || "").split(",").map((item) => item.trim()).filter(Boolean);
    const tipo = req.query.tipo === "enviados" ? "enviados" : "recibir";
    const result = await service.listarPendientesPorAlmacenes(almacenes, tipo);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/pendientes/contar", async (req, res, next) => {
  try {
    const almacenes = String(req.query.almacenes || "").split(",").map((item) => item.trim()).filter(Boolean);
    const total = await service.contarPendientes(almacenes);
    res.json({ total });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/aceptar", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usuario } = req.body;
    const result = await service.aceptarTraslado(id, usuario);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/rechazar", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usuario, motivo } = req.body;
    const result = await service.rechazarTraslado(id, usuario, motivo);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/evidencias/listar", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usuario } = req.body;
    const result = await service.listarEvidenciasTraslado(id, usuario);
    res.json({ success: true, data: result.fotos, carpetaUrl: result.carpetaUrl });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/articulos/listar", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usuario } = req.body;
    const result = await service.listarArticulosTraslado(id, usuario);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});


//ACTUALIZACIONES PARCIALES
router.patch("/modificar/:id",
  validatorHandler(modificarTraslado, "body"),
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

router.patch("/recibir/:id",
  validatorHandler(recibirTraslado, "body"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const body = req.body;
      const data = {
        ...body
      }
      const item = await service.update(id, data)
      res.json({
        message: 'El item fue actualizado',
        data: item,
        id
      })
    } catch (error) {
      next(error);
    }
  });


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
router.post("/",
  validatorHandler(realizarTraslado, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const data = {
        ...body
      }
      const itemNuevo = await service.create(data);
      res.json({
        message: "item creado",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }

  });

//ELIMINAR
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
