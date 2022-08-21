const { Strategy } = require('passport-local');
const bcrypt = require('bcryptjs');
const boom = require('@hapi/boom');

const userServices = require('../../../services/usuarios.service');
const service = new userServices();

const LocalStrategy = new Strategy(async (username, password, done) => {
  try {
    const user = await service.findOne(username)
    if (!user) done(boom.unauthorized(), false)
    const hash = user.password
    const isValid = await bcrypt.compare(password, hash)
    if (!isValid) done(boom.unauthorized("Contraseña incorrecta"), false)
    done(null, user)
  } catch (err) {
    done(err, false);
  }
});

module.exports = { LocalStrategy };
