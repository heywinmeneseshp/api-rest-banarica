const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const boom = require('@hapi/boom');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const db = require('../models');

const userService = require('./usuarios.service');
const service = new userService();


class AuthService {

  async getUser(username, password) {
    const user = await service.findOne(username)
    if (!user) return
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return
    delete user.dataValues.password
    return user
  }

  async getProfile(username) {
    const user = await db.usuarios.findOne({
      where: { username },
      attributes: { exclude: ['password'] }
    });
    
    const almacenes = await db.almacenes_por_usuario.findAll({
      where: { username, habilitado: true },
      include: [{ model: db.almacen, as: 'almacen' }]
    });
    
    return { usuario: user, almacenes: almacenes.map(item => item.almacen) };
  }
  

  signToken(user) {
    const { username, id_rol } = user;
    return jwt.sign({ username, id_rol }, env.secret, { expiresIn: '24h' });
  }

  async recoveryPassword(username) {
    const user = await service.findOne(username);
    if (!user) {
      throw boom.unauthorized("El usuario no existe");
    }

    const payload = { username };
    const token = jwt.sign(payload, env.secret, { expiresIn: '15min' });
    await service.update(username, { recovery_token: token });

    const link = `https://app-banarica.vercel.app/recovery?token=${token}`;
    const infoEmail = {
      from: env.email,
      to: user.email,
      subject: "Recuperar contraseña",
      html: `<p>Hola ${user.nombre} ${user.apellido}, tienes 15 minutos para recuperar tu contraseña ingresando a este <a href="${link}">enlace</a>.</p>`
    };

    await this.sendMail(infoEmail);
    return { message: "Se ha enviado un correo a tu email", token };
  }


  async changePassword(token, changes) {
    try {
      const payload = jwt.verify(token, env.secret);
      const user = await service.findOne(payload.username);
      if (user.dataValues.recovery_token === token) {
        await service.update(payload.username, { password: changes.password, recovery_token: null });
        return { message: "Se ha cambiado la contraseña" };
      } else {
        throw boom.unauthorized("El token no es válido");
      }
    } catch (error) {
      throw boom.unauthorized("El token no es válido");
    }
  }

  async sendMail(infoEmail) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: env.email,
        pass: env.password,
      }
    });
    await transporter.sendMail(infoEmail);
    return { message: "Se ha enviado un correo a tu cuenta de correo" }
  }

}

module.exports = AuthService;
