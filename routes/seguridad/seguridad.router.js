const express = require("express");

const router = express.Router();
const SeguridadService = require('../../services/seguridad/seguridad.service')
const service = new SeguridadService()


//LISTAR SERIALES
router.post("/encontrar-serial", async (req, res, next) => {
  try {
    const body = req.body
    const result = await service.encontrarUnserial(body)
    res.json(result)
  } catch (e) {
    next(e)
  }
});

//LISTAR SERIALES
router.post("/seriales", async (req, res, next) => {
  try {
    const { pagination, data } = req.body
    const result = await service.listarSeriales(pagination, data)
    res.json(result)
  } catch (e) {
    next(e)
  }
});

//LISTAR USUARIOS
router.post("/usuarios", async (req, res, next) => {
  try {
    const { offset, limit, username } = req.body;
    const result = await service.paginarUsuarios(offset, limit, username);
    res.json(result)
  } catch (e) {
    next(e)
  }
});

//ACTUALIZAR SERIALES
router.patch("/actualizar-seriales", async (req, res, next) => {
  try {
    const data = req.body
    const result = await service.actualizarSeriales(data)
    res.json(result)
  } catch (e) {
    next(e)
  }
});

router.post("/cargar-seriales", async (req, res, next) => {
  try {
    const data = req.body
    const result = await service.cargarSeriales(data);
    res.json(result)
  } catch (e) {
    next(e)
  }
});

//LISTAR PRODUCTOS
router.get("/listar-articulos",
  async (req, res, next) => {
    try {
      const result = await service.listarArticulosSeguridad();
      res.json(result)
    } catch (e) {
      next(e)
    }
  });

router.post("/encontrar-una-serial",
  async (req, res, next) => {
    try {
      const body = req.body
      const result = await service.buscarUnSerial(body);
      res.json(result)
    } catch (e) {
      next(e)
    }
  });

router.patch("/actualizar-serial",
  async (req, res, next) => {
    try {
      const body = req.body
      const result = await service.actualizarSerial(body)
      res.json(result)
    } catch (e) {
      next(e)
    }
  })


  //Insepeccion antinarcoticos
router.post("/inspeccion-antinarcoticos",
  async (req, res, next) => {
    try {
      const body = req.body
      const result = await service.inspeccionAntinarcoticos(body)
      res.json(result)
    } catch (e) {
      next(e)
    }
  }
)


module.exports = router;
