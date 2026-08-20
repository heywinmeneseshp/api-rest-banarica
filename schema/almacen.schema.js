const Joi = require('joi');

const consecutivo = Joi.string().alphanum().min(3);
const nombre = Joi.string();
const id = Joi.any();
const razon_social = Joi.string();
const direccion = Joi.string().max(100);
const telefono = Joi.string().min(7);
const email = Joi.string().email();
const isBlock = Joi.boolean();

const crearAlmacen = Joi.object({
      id,
      consecutivo: consecutivo,
      nombre: nombre.required(),
      // Opcionales: los almacenes que llegan por integración desde Corbana
      // (al crear una finca allá) solo traen nombre/consecutivo, no estos
      // datos administrativos — se completan a mano después si hace falta.
      razon_social: razon_social,
      direccion: direccion,
      telefono: telefono,
      email: email,
      isBlock,
});

const actualizarAlmacen = Joi.object({
      id,
      consecutivo: consecutivo,
      nombre: nombre,
      razon_social: razon_social,
      direccion: direccion,
      telefono: telefono,
      email: email,
      isBlock,
});

module.exports = { crearAlmacen, actualizarAlmacen };
