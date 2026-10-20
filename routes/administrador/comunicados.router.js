const express = require('express');
const passport = require('passport');
const multer = require('multer');
const boom = require('@hapi/boom');

const ComunicadosService = require('../../services/comunicados.service');
const { checkSuperAdminRole } = require('../../middlewares/auth.handler');

const router = express.Router();
const service = new ComunicadosService();

const MAX_ADJUNTOS = 5;
const MAX_ADJUNTO_MB = 8;

// Adjuntos solo en memoria: nunca tocan el disco del servidor.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ADJUNTO_MB * 1024 * 1024, files: MAX_ADJUNTOS },
}).array('adjuntos', MAX_ADJUNTOS);

function subirAdjuntos(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return next(boom.badRequest(`Cada adjunto puede pesar maximo ${MAX_ADJUNTO_MB} MB`));
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return next(boom.badRequest(`Maximo ${MAX_ADJUNTOS} adjuntos por comunicado`));
    return next(err);
  });
}

// El envio llega como multipart/form-data: los arreglos (correos, roles,
// usuarios) llegan como texto JSON y hay que parsearlos.
function parsearArreglos(req, _res, next) {
  for (const campo of ['correos', 'roles', 'usuarios']) {
    if (typeof req.body[campo] === 'string') {
      try {
        req.body[campo] = JSON.parse(req.body[campo]);
      } catch {
        req.body[campo] = [];
      }
    }
  }
  next();
}

const auth = [passport.authenticate('jwt', { session: false }), checkSuperAdminRole];

const soloAutenticado = passport.authenticate('jwt', { session: false });

// ---- Mensajes del propio usuario (cualquier rol autenticado) ----
router.get('/mis-mensajes/no-leidos', soloAutenticado, async (req, res, next) => {
  try {
    res.json({ total: await service.contarNoLeidos(req.user.username) });
  } catch (error) {
    next(error);
  }
});

router.get('/mis-mensajes', soloAutenticado, async (req, res, next) => {
  try {
    res.json(await service.misMensajes(req.user.username, { page: req.query.page, limit: req.query.limit }));
  } catch (error) {
    next(error);
  }
});

router.patch('/mis-mensajes/leer-todos', soloAutenticado, async (req, res, next) => {
  try {
    res.json(await service.marcarTodosLeidos(req.user.username));
  } catch (error) {
    next(error);
  }
});

router.patch('/mis-mensajes/:id/leido', soloAutenticado, async (req, res, next) => {
  try {
    res.json(await service.marcarLeido(req.user.username, req.params.id));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /comunicados/destinatarios:
 *   get:
 *     summary: Roles y usuarios disponibles como destinatarios. Solo Super administrador.
 *     tags: [Comunicados]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/destinatarios', auth, async (req, res, next) => {
  try {
    res.json(await service.destinatariosDisponibles());
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /comunicados:
 *   get:
 *     summary: Historial de comunicados enviados. Solo Super administrador.
 *     tags: [Comunicados]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *   post:
 *     summary: Enviar un comunicado por correo a roles, usuarios y/o correos manuales. Solo Super administrador.
 *     tags: [Comunicados]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Enviado }
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    res.json(await service.list({ page, limit, search }));
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, subirAdjuntos, parsearArreglos, async (req, res, next) => {
  try {
    const creado = await service.enviar(req.body, req.user?.username, req.files || []);
    res.status(201).json(creado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /comunicados/{id}:
 *   get:
 *     summary: Detalle de un comunicado (incluye el resultado por destinatario). Solo Super administrador.
 *     tags: [Comunicados]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/:id', auth, async (req, res, next) => {
  try {
    res.json(await service.findOne(req.params.id));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
