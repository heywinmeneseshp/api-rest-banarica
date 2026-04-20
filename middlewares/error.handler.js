const env = require('../config/env');

function logErrors(err, req, res, next) {
  console.error(err);
  next(err)
}

function errorHandler(err, req, res, next) {
  const isProduction = env.nodeEnv === 'production';
  res.status(500).json({
    message: isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  })
}

function boomErrorHandler(err, req, res, next) {
  if (err.isBoom){
    const { output } = err;
    return res.status(output.statusCode).json(output.payload);
  }
  next(err);
}



module.exports = { logErrors, errorHandler, boomErrorHandler }
