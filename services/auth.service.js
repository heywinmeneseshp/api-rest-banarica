const jwt = require('jsonwebtoken');
const boom = require('@hapi/boom');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const db = require('../models');
const { normalizeRole } = require('../middlewares/auth.handler');
const { PasswordPolicyService } = require('./password-policy.service');

const userService = require('./usuarios.service');
const EmailService = require('./email.service');
const service = new userService();
const passwordPolicyService = new PasswordPolicyService();
const emailService = new EmailService();


class AuthService {

  async getUser(username, password) {
    const user = await service.findOne(username)
    if (!user) return
    await passwordPolicyService.enforceForLogin(user);
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
      include: [{ model: db.almacenes, as: 'almacen' }]
    });
  
    return { usuario: user, almacenes: almacenes.map(item => item.almacen) };
  }
  
  

  signToken(user) {
    const { username } = user;
    const id_rol = normalizeRole(user.id_rol);
    return jwt.sign({ username, id_rol }, env.secret, { expiresIn: '24h' });
  }

async recoveryPassword(username) {
    const user = await service.findOne(username);
    if (!user) {
      throw boom.unauthorized("El usuario no existe");
    }

    const payload = { username };
    const token = jwt.sign(payload, env.recoverySecret, { expiresIn: '15min' });
    await service.update(username, { recovery_token: token });

    const link = `${env.frontendUrl}/recovery?token=${token}`;
    const infoEmail = {
      to: user.email,
      subject: "Recuperar contraseña",
      html: `<p>Hola ${user.nombre} ${user.apellido}, tienes 15 minutos para recuperar tu contraseña ingresando a este <a href="${link}">enlace</a>.</p>`
    };

    await this.sendMail(infoEmail);
    return { message: "Se ha enviado un correo a tu email" };
  }


  async changePassword(token, changes) {
    try {
      const payload = jwt.verify(token, env.recoverySecret);
      const user = await service.findOne(payload.username);
      if (user.dataValues.recovery_token === token) {
        await service.update(payload.username, { password: changes.password });
        await passwordPolicyService.markPasswordChanged(payload.username);
        return { message: "Se ha cambiado la contraseña" };
      } else {
        throw boom.unauthorized("El token no es válido");
      }
    } catch (error) {
      throw boom.unauthorized("El token no es válido");
    }
  }

  async runPasswordPolicyCycle() {
    return await passwordPolicyService.runCycle();
  }

async sendMail(infoEmail) {
    const config = await emailService.getEmailConfig();
    const transporter = emailService.buildTransporter(config);

    await transporter.sendMail({
      ...infoEmail,
      from: emailService.buildFrom(config),
    });
    return { message: "Se ha enviado un correo a tu cuenta de correo" }
  }

}

module.exports = AuthService;
