const boom = require('@hapi/boom');
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

module.exports = { checkApiKey, checkSuperAdminRole, checkAllowedRoles, normalizeRole, ROLES };
