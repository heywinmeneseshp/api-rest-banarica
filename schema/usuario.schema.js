const Joi = require('joi');

const username = Joi.string();
const nombre = Joi.string();
const apellido = Joi.string();
const email = Joi.string().email();
const password = Joi.string();
const tel = Joi.string().min(7);
const id_rol = Joi.string();
const isBlock = Joi.boolean();

const id_almacen = Joi.string();

const crearUsuario = Joi.object({
  username: username.required(),
  nombre: nombre.required(),
  apellido: apellido.required(),
  email: email.required(),
  password: password.required(),
  tel: tel.required(),
  id_rol: id_rol.required(),
  isBlock: isBlock.required()
});

const actualizarUsuario = Joi.object({
  username: username,
  nombre: nombre,
  apellido: apellido,
  email: email,
  password: password,
  tel: tel,
  id_rol: id_rol,
  isBlock: isBlock
});

const agregarAlmacenParaUsuario = Joi.object({
  id_almacen: id_almacen.required(),
  username: username.required(),
  habilitado: isBlock.required(),
})

const actualizarUsuarioPorAlmacen = Joi.object({
  id_almacen: id_almacen.required(),
  username: username.required(),
  habilitado: isBlock
})

module.exports = { crearUsuario, actualizarUsuario, agregarAlmacenParaUsuario, actualizarUsuarioPorAlmacen  };
