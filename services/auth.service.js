const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const boom = require('@hapi/boom');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const userService = require('./usuarios.service');
const service = new userService();


class AuthService {

  async getUser(username, password) {
    const user = await service.findOne(username)
    if (!user) done(boom.unauthorized(), false)
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) done(boom.unauthorized("Contraseña incorrecta"), false)
    delete user.dataValues.password
    return user
  }

  singToken(user) {
    const payload = {
      username: user.username,
      id_rol: user.id_rol,
    };
    return jwt.sign(payload, env.secret, { expiresIn: '1h' });
  }

  async recoveryPassword(username) {
    const user = await service.findOne(username)
    if (!user) throw boom.unauthorized("El usuario no existe")
    const payload = { username: username }
    const token = jwt.sign(payload, env.secret, { expiresIn: '15min' });
    await service.update(username, { recovery_token: token })
    const link = `https://app-banarica.vercel.app/recovery?token=${token}`;
    const infoEmail = {
      from: env.email,
      to: user.email,
      subject: "Recuperar contraseña",
      html: `<p>Hola ${user.nombre} ${user.apellido}, tienes 15 minutos para recuperar tu contraseña ingresando a este link: <a href="${link}">${link}</a></p>`
    }
    await this.sendMail(infoEmail)
    return { message: "Se ha enviado un correo a tu email", token }
  }

  async changePassword(token, changes) {
    const payload = jwt.verify(token, env.secret)
    const user = await service.findOne(payload.username)
    if (user.dataValues.recovery_token === token ){ //return boom.unauthorized("El token no es valido")
      await service.update(payload.username, { password: changes.password, recovery_token: null })
      return { message: "Se ha cambiado la contraseña" }
    } else {
      return boom.unauthorized("El token no es valido")
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
