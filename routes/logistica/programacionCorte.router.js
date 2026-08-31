const express = require('express');
const passport = require('passport');
const { checkApiKeyOrJwt } = require('../../middlewares/auth.handler');
const ProgramacionCorteService = require('../../services/logistica/programacionCorte.service');

const router = express.Router();
const service = new ProgramacionCorteService();

/**
 * @swagger
 * tags:
 *   name: ProgramacionCorte
 *   description: Programacion de corte (fecha/booking/proceso de empaque/finca/producto/cajas) y su comparativa contra Listado
 */

/**
 * @swagger
 * /programacion-corte:
 *   get:
 *     summary: Lista toda la programacion de corte cargada
 *     tags: [ProgramacionCorte]
 *     description: Acepta login JWT normal o el header `api` con la API key (integraciones servidor-a-servidor, ej. api-rest-corbana).
 *     responses:
 *       200: { description: Lista completa }
 */
// GET / acepta el header `api` (integraciones servidor-a-servidor, ej.
// api-rest-corbana) además del login JWT normal — ver checkApiKeyOrJwt.
router.get('/', checkApiKeyOrJwt, async (req, res, next) => {
  try {
    const items = await service.listar();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-corte/cargar:
 *   post:
 *     summary: Carga masiva de programacion de corte para una semana (reemplaza lo existente de esa semana)
 *     tags: [ProgramacionCorte]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filas, semana]
 *             properties:
 *               semana: { type: string, example: "S34-2026" }
 *               filas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fecha: { type: string }
 *                     booking: { type: string }
 *                     transportadora: { type: string }
 *                     proceso_empaque: { type: string, enum: [Finca, Local, Puerto, "Contenedor Local"] }
 *                     finca: { type: string }
 *                     combo: { type: string, description: "Nombre o consecutivo del producto" }
 *                     cajas: { type: number }
 *     responses:
 *       200: { description: "Resultado del cargue (creados, borrados, errores por fila)" }
 */
router.post('/cargar', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const resultado = await service.cargar(req.body.filas, req.body.semana);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-corte/comparativa:
 *   get:
 *     summary: Compara cajas programadas vs cajas en Listado, por fecha/booking/lugar de llenado/producto
 *     tags: [ProgramacionCorte]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: semana
 *         required: true
 *         schema: { type: string, example: "S34-2026" }
 *     responses:
 *       200:
 *         description: Totales y filas con estado coincide/difiere/solo_programacion/solo_listado
 */
router.get('/comparativa', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const resultado = await service.comparativa(req.query.semana);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-corte/{id}/listado-relacionado:
 *   get:
 *     summary: Lineas reales de Listado que se relacionan con una fila puntual de Programacion de Corte
 *     tags: [ProgramacionCorte]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Fecha/booking/finca/producto de la fila, y las lineas de Listado encontradas" }
 */
router.get('/:id/listado-relacionado', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const resultado = await service.lineasListadoRelacionadas(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /programacion-corte/{id}:
 *   delete:
 *     summary: Elimina una fila de programacion de corte
 *     tags: [ProgramacionCorte]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Fila eliminada }
 */
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const result = await service.eliminar(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
