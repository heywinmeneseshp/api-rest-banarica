const Joi = require('joi');

const id = Joi.string().alphanum().min(3);
const nombre = Joi.string();
const razon_social = Joi.string();
const direccion = Joi.string().max(100);
const telefono = Joi.string().min(7);
const email = Joi.string().email();
const estado = Joi.boolean();

const crearAlmacen = Joi.object({
      id: id.required(),
      nombre: nombre.required(),
      razon_social: razon_social.required(),
      direccion: direccion.required(),
      telefono: telefono.required(),
      email: email.required(),
      estado: estado.required()
});

const actualizarAlmacen = Joi.object({
      id: id,
      nombre: nombre,
      razon_social: razon_social,
      direccion: direccion,
      telefono: telefono,
      email: email,
      estado: estado
});

module.exports = { crearAlmacen, actualizarAlmacen };
