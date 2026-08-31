const express = require("express");
const passport = require("passport");

const router = express.Router();
const SeguridadService = require('../../services/seguridad/seguridad.service')
const service = new SeguridadService()

/**
 * @swagger
 * tags:
 *   name: Seguridad
 *   description: Inspecciones antinarcoticos, uso de seriales de kits de seguridad y trazabilidad de contenedores
 */

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
/**
 * @swagger
 * /seguridad/seriales:
 *   post:
 *     summary: POST /seriales
 *     tags: [Seguridad]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /seguridad/usuarios:
 *   post:
 *     summary: POST /usuarios
 *     tags: [Seguridad]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /seguridad/actualizar-seriales:
 *   patch:
 *     summary: PATCH /actualizar-seriales
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.patch("/actualizar-seriales",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
  try {
    const data = req.body
    const result = await service.actualizarSeriales(data, req.user)
    res.json(result)
  } catch (e) {
    next(e)
  }
});

/**
 * @swagger
 * /seguridad/cargar-seriales:
 *   post:
 *     summary: POST /cargar-seriales
 *     tags: [Seguridad]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/cargar-seriales", async (req, res, next) => {
  try {
    const data = req.body
    const result = await service.cargarSeriales(data);
    res.json(result)
  } catch (e) {
    next(e)
  }
});

/**
 * @swagger
 * /seguridad/deshacer-carga-seriales:
 *   post:
 *     summary: POST /deshacer-carga-seriales
 *     tags: [Seguridad]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/deshacer-carga-seriales", async (req, res, next) => {
  try {
    const { cons_movimiento } = req.body;
    const result = await service.deshacerCargaSeriales(cons_movimiento);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

//LISTAR PRODUCTOS
/**
 * @swagger
 * /seguridad/listar-articulos:
 *   get:
 *     summary: GET /listar-articulos
 *     tags: [Seguridad]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/listar-articulos",
  async (req, res, next) => {
    try {
      const result = await service.listarArticulosSeguridad();
      res.json(result)
    } catch (e) {
      next(e)
    }
  });

/**
 * @swagger
 * /seguridad/encontrar-una-serial:
 *   post:
 *     summary: POST /encontrar-una-serial
 *     tags: [Seguridad]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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

/**
 * @swagger
 * /seguridad/actualizar-serial:
 *   patch:
 *     summary: PATCH /actualizar-serial
 *     tags: [Seguridad]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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


/**
 * @swagger
 * /seguridad/inspeccion-antinarcoticos:
 *   post:
 *     summary: Registra la inspeccion antinarcoticos de un contenedor lleno (usa el kit de seguridad y descuenta stock)
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [formulario]
 *             properties:
 *               formulario:
 *                 type: object
 *                 required: [consecutivo, fecha]
 *                 properties:
 *                   consecutivo: { type: integer, description: "Id del contenedor" }
 *                   fecha: { type: string, example: "2026-08-21" }
 *                   hora_inicio: { type: string, example: "15:20" }
 *                   hora_fin: { type: string, example: "16:45" }
 *                   agente: { type: string }
 *                   zona: { type: string, example: "Z3" }
 *                   bolsa: { type: string, description: "Codigo del kit (bag_pack)" }
 *                   observaciones: { type: string }
 *               rechazos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     producto: { type: integer }
 *                     totalCajas: { type: number }
 *                     codigoPallet: { type: string }
 *                     cod_productor: { type: string }
 *     responses:
 *       200: { description: "Inspeccion guardada (aprobada o pendiente de aprobacion de un Super administrador)" }
 *       400: { description: "Datos invalidos o kit sin articulos disponibles" }
 */
//Insepeccion antinarcoticos
router.post("/inspeccion-antinarcoticos",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const body = req.body
      const result = await service.inspeccionAntinarcoticos(body, req.user)
      res.json(result)
    } catch (e) {
      next(e)
    }
  }
)

/**
 * @swagger
 * /seguridad/aprobar-inspeccion-lleno:
 *   post:
 *     summary: POST /aprobar-inspeccion-lleno
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/aprobar-inspeccion-lleno",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const result = await service.aprobarInspeccionLleno(req.body, req.user)
      res.json(result)
    } catch (e) {
      next(e)
    }
  }
)

/**
 * @swagger
 * /seguridad/rechazar-inspeccion-lleno:
 *   post:
 *     summary: POST /rechazar-inspeccion-lleno
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/rechazar-inspeccion-lleno",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const result = await service.rechazarInspeccionLleno(req.body, req.user)
      res.json(result)
    } catch (e) {
      next(e)
    }
  }
)

/**
 * @swagger
 * /seguridad/revertir-masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/revertir-masivo",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { seriales } = req.body;
      const result = await service.revertirSerialsMasivo(seriales);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /seguridad/transferir-contenedor:
 *   post:
 *     summary: POST /transferir-contenedor
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/transferir-contenedor",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { seriales, id_contenedor } = req.body;
      const result = await service.transferirContenedor(seriales, id_contenedor);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /seguridad/usar-seriales:
 *   post:
 *     summary: Asigna un kit de seriales a un contenedor (usado desde "Asignar Seriales" del Dashboard)
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [formulario]
 *             properties:
 *               formulario:
 *                 type: object
 *                 required: [bolsa, fecha, contenedorId]
 *                 properties:
 *                   bolsa: { type: string, description: "Codigo del kit (bag_pack)" }
 *                   fecha: { type: string, example: "2026-08-21" }
 *                   semana: { type: string, example: "S34-2026" }
 *                   contenedorId: { type: integer }
 *                   id_usuario: { type: integer }
 *               motivo_de_uso:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   consecutivo: { type: string }
 *                   id: { type: integer }
 *     responses:
 *       200: { description: Seriales asignados y stock descontado }
 *       400: { description: "Kit sin articulos disponibles, o el articulo no se pudo actualizar" }
 */
router.post("/usar-seriales",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const body = req.body
      const result = await service.usarSeriales(body, req.user)
      res.json(result)
    } catch (e) {
      next(e)
    }
  }
)

/**
 * @swagger
 * /seguridad/corregir-inspeccion-contenedor:
 *   post:
 *     summary: POST /corregir-inspeccion-contenedor
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/corregir-inspeccion-contenedor",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const result = await service.corregirInspeccionContenedor(req.body, req.user);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
)

/**
 * @swagger
 * /seguridad/inspeccion-vacio-masivo:
 *   post:
 *     summary: Operacion masiva (POST)
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/inspeccion-vacio-masivo",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const result = await service.cargarInspeccionVacioMasivo(req.body, req.user);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
)

/**
 * @swagger
 * /seguridad/inspeccion-vacio:
 *   post:
 *     summary: POST /inspeccion-vacio
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/inspeccion-vacio",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const result = await service.crearInspeccionVacio(req.body, req.user);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
)

/**
 * @swagger
 * /seguridad/corregir-serial:
 *   post:
 *     summary: POST /corregir-serial
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/corregir-serial",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const result = await service.corregirAsignacionSerial(req.body, req.user);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
)

/**
 * @swagger
 * /seguridad/dar-de-baja-serial:
 *   post:
 *     summary: POST /dar-de-baja-serial
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/dar-de-baja-serial",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const result = await service.darDeBajaSerial(req.body, req.user);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
)

/**
 * @swagger
 * /seguridad/revertir-seriales-contenedor:
 *   post:
 *     summary: POST /revertir-seriales-contenedor
 *     tags: [Seguridad]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/revertir-seriales-contenedor",
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { id_contenedor, serial_ids } = req.body;
      const result = await service.revertirSerialesContenedor(id_contenedor, serial_ids);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
)

module.exports = router;


