const Joi = require('joi');

const consecutivo = Joi.string().min(4).allow('');
const conductor = Joi.string().max(100);
const licencia = Joi.string().max(20).allow('').default('');
const cons_transportadora = Joi.string().allow('').default('');
const email = Joi.string().email().allow('').default('');
const tel = Joi.string().allow('').default('');
const isBlock = Joi.boolean().default(false);
const isBlockUpdate = Joi.boolean();

const crearConductor = Joi.object({
  consecutivo: consecutivo,
  conductor: conductor.required(),
  cons_transportadora: cons_transportadora,
  email: email,
  tel: tel,
  licencia: licencia,
  isBlock: isBlock
});

const actualizarConductor = Joi.object({
  consecutivo: consecutivo,
  conductor: conductor,
  cons_transportadora: cons_transportadora,
  email: email,
  tel: tel,
  licencia: licencia,  // ← Agrega esta línea
  isBlock: isBlockUpdate
});

module.exports = { crearConductor, actualizarConductor };
