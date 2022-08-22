const boom = require('@hapi/boom');
const env = require('../config/env');


function checkApiKey(req, res, next) {
  const  apiKey  = req.headers['api'];
  if (!apiKey) {
    next(boom.unauthorized('Missing api key'));
  } else if (apiKey !== env.apiKey) {
    next(boom.unauthorized('Invalid api key'));
  } else {
    next();
  }
}

function checkSuperAdminRole(req, res, next) {
  const  id_rol  = req.user.id_rol;
  if (id_rol !== 'Super administrador') {
    next(boom.unauthorized('Usted no esta autorizado para realizar esta acción'));
  } else {
    next();
  }
}

module.exports = { checkApiKey, checkSuperAdminRole };
