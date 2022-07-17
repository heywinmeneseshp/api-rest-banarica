const Joi = require('joi');

const consecutivo = Joi.string().alphanum().min(3);
const nombre = Joi.string();
const razon_social = Joi.string();
const direccion = Joi.string().max(100);
const telefono = Joi.string().min(7);
const email = Joi.string().email();
const isBlock = Joi.boolean();

const crearAlmacen = Joi.object({
      consecutivo: consecutivo,
      nombre: nombre.required(),
      razon_social: razon_social.required(),
      direccion: direccion.required(),
      telefono: telefono.required(),
      email: email.required(),
      isBlock: isBlock.required()
});

const actualizarAlmacen = Joi.object({
      consecutivo: consecutivo,
      nombre: nombre,
      razon_social: razon_social,
      direccion: direccion,
      telefono: telefono,
      email: email,
      isBlock: isBlock
});

module.exports = { crearAlmacen, actualizarAlmacen };
