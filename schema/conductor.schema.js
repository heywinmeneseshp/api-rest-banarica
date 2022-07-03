const Joi = require('joi');

const id = Joi.string().min(4);
const conductor = Joi.string().max(100);
const id_transportadora = Joi.string().min(4);
const email = Joi.string().email();
const tel = Joi.string().min(7);
const isBlock = Joi.boolean();

const crearConductor = Joi.object({
  id: id,
  conductor: conductor.required(),
  id_transportadora: id_transportadora.required(),
  email: email.required(),
  tel: tel.required(),
  isBlock: isBlock.required()
});

const actualizarConductor = Joi.object({
  id: id,
  conductor: conductor,
  id_transportadora: id_transportadora,
  email: email,
  tel: tel,
  isBlock: isBlock
});

module.exports = { crearConductor, actualizarConductor };
