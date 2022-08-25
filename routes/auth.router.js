const express = require('express');
const passport = require('passport');

const AuthService = require('../services/auth.service');
const service = new AuthService();



const router = express.Router();

router.post('/login',
  passport.authenticate('local', { session: false }),
  async (req, res, next) => {
    try {
      const token = service.singToken(req.user);
      res.json({ usuario: req.user, token: token });
    } catch (err) {
      next(err);
    }
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
  })

module.exports = router;
