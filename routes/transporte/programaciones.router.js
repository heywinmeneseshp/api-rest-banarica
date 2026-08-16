const express = require("express");
const passport = require("passport");

const itemService = require("../../services/transporte/programaciones.service");
const env = require("../../config/env");
const router = express.Router();
const service = new itemService();

router.get("/", async (req, res, next) => {
  try {
    const result = await service.find();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
router.post("/paginar", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const body = req.body;
    const items = await service.paginate(page, limit, body, req.user);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// ─── Endpoint para Excel / Power Query ──────────────────────────────────────
// GET /api/v1/programaciones/excel?api_key=TU_KEY&semana=W01&fechaInicio=2025-01-01&fechaFin=2025-12-31&transportadoraId=3
// Autenticación: header "api: TU_KEY"  o  query param "?api_key=TU_KEY"
router.get("/excel", async (req, res, next) => {
  try {
    const apiKey = req.headers["api"] || req.query.api_key;
    if (!apiKey || apiKey !== env.apiKey) {
      return res.status(401).json({ message: "API key invalida o no proporcionada" });
    }
    const { semana, fechaInicio, fechaFin, transportadoraId } = req.query;
    const result = await service.getForExcel({ semana, fechaInicio, fechaFin, transportadoraId });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Historial general (filtrable), util para consultar que habia antes de una
// eliminacion ya que la fila deja de existir en programacion (hard delete).
// Debe ir antes de "/:id" para que Express no lo confunda con un id.
router.post("/historial/paginar", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await service.paginarHistorial(page, limit, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/historial", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.historialPorId(id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await service.findOne(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const body = req.body;
      const itemNuevo = await service.create(body, req.user?.username);
      res.json({
        message: "item creado",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }
  });

router.patch("/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      await service.update(id, body, req.user?.username)
      res.json({
        message: "item actualizado",
        data: body
      })
    } catch (error) {
      next(error)
    }
  });

router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.delete(id, req.user?.username)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

router.post("/actualizar-masivo", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const rows = req.body;
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ message: 'Se requiere un array de programaciones' });
    }
    const result = await service.bulkUpdate(rows, req.user?.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
