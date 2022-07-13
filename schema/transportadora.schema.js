const Joi = require('joi');

const consecutivo = Joi.string().min(4);
const razon_social = Joi.string().min(4);
const direccion = Joi.string().max(100);
const tel = Joi.string().max(20);
const email = Joi.string().email();
const isBlock = Joi.boolean();

const crearTransportadora = Joi.object({
  consecutivo: consecutivo,
  razon_social: razon_social.required(),
  direccion: direccion.required(),
  tel: tel.required(),
  email: email.required(),
  isBlock: isBlock.required()
});

const actualizarTransportadora = Joi.object({
  razon_social: razon_social,
  direccion: direccion,
  tel: tel,
  email: email,
  isBlock: isBlock
});

module.exports = { crearTransportadora, actualizarTransportadora };
