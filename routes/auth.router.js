const express = require('express');
const passport = require('passport');
const { checkSuperAdminRole } = require('../middlewares/auth.handler');

const AuthService = require('../services/auth.service');
const service = new AuthService();



const router = express.Router();

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
