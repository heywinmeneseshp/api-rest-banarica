const express = require('express');
const passport = require('passport');
const { checkSuperAdminRole } = require('../middlewares/auth.handler');

const AuthService = require('../services/auth.service');
const service = new AuthService();



const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Login y perfil — el token de /auth/login es el que se usa como Bearer en el resto de la API
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesion y devuelve el token JWT a usar como Bearer en el resto de endpoints
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Usuario y token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario: { type: object }
 *                 token: { type: string }
 *       401: { description: Usuario o contrasena incorrectos }
 */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user) => {
    try {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: 'Usuario o contrasena incorrectos' });
      }

      const token = service.signToken(user);
      return res.json({ usuario: user, token: token });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Perfil del usuario autenticado (rol, transportadoras asignadas, etc.)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil del usuario }
 */
  router.get('/profile',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const profile = await service.getProfile(req.user.username)
      res.json(profile);
    } catch (err) {
      next(err);
    }
  });


/**
 * @swagger
 * /auth/recovery:
 *   post:
 *     summary: POST /recovery
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/recovery',
  async (req, res, next) => {
    try {
      const { username } = req.body;
      const user = await service.recoveryPassword(username);
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /auth/changePassword:
   *   post:
   *     summary: POST /changePassword
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { type: object }
   *     responses:
   *       200: { description: OK }
   */
  router.post('/changePassword',
  async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const user = await service.changePassword(token, {password: password});
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

/**
 * @swagger
 * /auth/password-policy/run:
 *   post:
 *     summary: POST /password-policy/run
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post('/password-policy/run',
  passport.authenticate('jwt', { session: false }),
  checkSuperAdminRole,
  async (req, res, next) => {
    try {
      const result = await service.runPasswordPolicyCycle();
      res.json({
        message: 'Politica de contrasenas ejecutada correctamente',
        data: result
      });
    } catch (err) {
      next(err);
    }
  });

module.exports = router;
