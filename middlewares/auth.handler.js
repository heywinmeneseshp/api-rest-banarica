const boom = require('@hapi/boom');
const env = require('../config/env');


function checkApiKey(req, res, next) {
  const  apiKey  = req.headers['api'];
  console.log(apiKey);
  if (!apiKey) {
    next(boom.unauthorized('Missing api key'));
  } else if (apiKey !== env.apiKey) {
    next(boom.unauthorized('Invalid api key'));
  } else {
    next();
  }
}

module.exports = { checkApiKey };
