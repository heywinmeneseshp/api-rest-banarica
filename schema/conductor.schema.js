const Joi = require('joi');

const consecutivo = Joi.string().min(4);
const conductor = Joi.string().max(100);
const cons_transportadora = Joi.string().allow('').default('');
const email = Joi.string().email().allow('').default('');
const tel = Joi.string().allow('').default('');
const isBlock = Joi.boolean().default(false);

const crearConductor = Joi.object({
  consecutivo: consecutivo,
  conductor: conductor.required(),
  cons_transportadora: cons_transportadora,
  email: email,
  tel: tel,
  isBlock: isBlock
});

const actualizarConductor = Joi.object({
  consecutivo: consecutivo,
  conductor: conductor,
  cons_transportadora: cons_transportadora,
  email: email,
  tel: tel,
  isBlock: isBlock
});

module.exports = { crearConductor, actualizarConductor };
