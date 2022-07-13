const Joi = require('joi');

const consecutivo = Joi.string().min(4);
const conductor = Joi.string().max(100);
const cons_transportadora = Joi.string().min(4);
const email = Joi.string().email();
const tel = Joi.string().min(7);
const isBlock = Joi.boolean();

const crearConductor = Joi.object({
  consecutivo: consecutivo,
  conductor: conductor.required(),
  cons_transportadora: cons_transportadora.required(),
  email: email.required(),
  tel: tel.required(),
  isBlock: isBlock.required()
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
