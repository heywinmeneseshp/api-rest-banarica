const { Strategy } = require('passport-local');
const bcrypt = require('bcryptjs');
const boom = require('@hapi/boom');

const AuthService = require('../../../services/auth.service');
const service = new AuthService();

const LocalStrategy = new Strategy({
  usernameField: 'username',
  passwordField: 'password',
},async (username, password, done) => {
  try {
    const user = await service.getUser(username, password);
    done(null, user)
  } catch (err) {
    done(err, false);
  }
});

module.exports = LocalStrategy;
