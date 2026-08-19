const boom = require('@hapi/boom');
const passport = require('passport');
const env = require('../config/env');

const ROLES = {
  SUPER_ADMIN: 'Super administrador',
  OPERADOR: 'Operador'
};

const LEGACY_OPERATOR_ROLES = ['Administrador', 'Seguridad', 'Super seguridad'];

function normalizeRole(role) {
  if (role === ROLES.SUPER_ADMIN) {
    return ROLES.SUPER_ADMIN;
  }

  if (role === ROLES.OPERADOR || LEGACY_OPERATOR_ROLES.includes(role)) {
    return ROLES.OPERADOR;
  }

  return role;
}

function checkApiKey(req, res, next) {
  const apiKey = req.headers['api'];
  if (!apiKey) {
    return next(boom.unauthorized('Missing api key'));
  }

  if (apiKey !== env.apiKey) {
    return next(boom.unauthorized('Invalid api key'));
  }

  next();
}

// Deja pasar directo si trae el header `api` válido (mismo API_KEY que
// checkApiKey), y si no cae al login JWT normal. Pensado para integraciones
// servidor-a-servidor (ej. api-rest-corbana) que no tienen un usuario propio
// en este sistema, sin sacarle el login JWT a quien ya lo usa (front propio).
function checkApiKeyOrJwt(req, res, next) {
  const apiKey = req.headers['api'];
  if (apiKey && env.apiKey && apiKey === env.apiKey) {
    return next();
  }
  return passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return next(boom.unauthorized('No autenticado'));
    req.user = user;
    next();
  })(req, res, next);
}

function checkSuperAdminRole(req, res, next) {
  const id_rol = normalizeRole(req.user.id_rol);
  if (id_rol !== ROLES.SUPER_ADMIN) {
    return next(boom.unauthorized('Usted no esta autorizado para realizar esta accion'));
  }

  next();
}

function checkAllowedRoles(allowedRoles = []) {
  return (req, res, next) => {
    const normalizedRole = normalizeRole(req.user.id_rol);
    if (!allowedRoles.includes(normalizedRole)) {
      return next(boom.unauthorized('Usted no esta autorizado para realizar esta accion'));
    }

    next();
  };
}

module.exports = { checkApiKey, checkApiKeyOrJwt, checkSuperAdminRole, checkAllowedRoles, normalizeRole, ROLES };
