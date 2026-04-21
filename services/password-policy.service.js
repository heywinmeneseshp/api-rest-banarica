const boom = require('@hapi/boom');
const db = require('../models');
const env = require('../config/env');
const EmailService = require('./email.service');

const emailService = new EmailService();

const PASSWORD_MAX_AGE_DAYS = 90;
const PASSWORD_REMINDER_DAYS = 15;
const POLICY_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getPolicyState(user, now = new Date()) {
  const changedAt = user.password_changed_at || user.updatedAt || user.createdAt || now;
  const expiresAt = addDays(changedAt, PASSWORD_MAX_AGE_DAYS);
  const reminderAt = addDays(changedAt, PASSWORD_MAX_AGE_DAYS - PASSWORD_REMINDER_DAYS);
  const isExpired = now >= expiresAt;
  const shouldSendReminder = now >= reminderAt && now < expiresAt && !user.password_reminder_sent_at;

  return {
    changedAt,
    expiresAt,
    reminderAt,
    isExpired,
    shouldSendReminder,
    daysUntilExpiry: Math.max(0, Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000))),
  };
}

class PasswordPolicyService {
  constructor() {
    this.intervalId = null;
  }

  async createTransporter() {
    const config = await emailService.getEmailConfig();
    if (!config.email_correo || !config.password_correo) {
      throw boom.internal('El servicio de correo no esta configurado');
    }

    return emailService.buildTransporter(config);
  }

  async sendReminderEmail(user, policyState) {
    if (!user.email) {
      return;
    }

    const transporter = await this.createTransporter();
    const config = await emailService.getEmailConfig();
    const recoveryLink = `${env.frontendUrl}/recovery`;
    const dayLabel = policyState.daysUntilExpiry === 1 ? '1 dia' : `${policyState.daysUntilExpiry} dias`;

    await transporter.sendMail({
      from: emailService.buildFrom(config),
      to: user.email,
      subject: 'Recordatorio de cambio de contrasena',
      html: `
        <p>Hola ${user.nombre || user.username},</p>
        <p>Tu contrasena vence en ${dayLabel}.</p>
        <p>Debes cambiarla antes de cumplir 90 dias para evitar el bloqueo de tu acceso.</p>
        <p>Puedes hacerlo desde este enlace: <a href="${recoveryLink}">${recoveryLink}</a></p>
      `
    });
  }

  async blockExpiredUser(user) {
    if (user.isBlock) {
      return;
    }

    await db.usuarios.update({
      isBlock: true,
      password_blocked_at: new Date(),
    }, {
      where: { username: user.username }
    });
  }

  async markReminderSent(user) {
    await db.usuarios.update({
      password_reminder_sent_at: new Date(),
    }, {
      where: { username: user.username }
    });
  }

  async runCycle() {
    const users = await db.usuarios.findAll();
    const now = new Date();
    const summary = {
      reviewed: users.length,
      reminded: 0,
      blocked: 0,
    };

    for (const user of users) {
      const policyState = getPolicyState(user, now);

      if (policyState.isExpired) {
        if (!user.isBlock) {
          summary.blocked += 1;
        }
        await this.blockExpiredUser(user);
        continue;
      }

      if (policyState.shouldSendReminder) {
        try {
          await this.sendReminderEmail(user, policyState);
          await this.markReminderSent(user);
          summary.reminded += 1;
        } catch (error) {
          console.error(`No se pudo enviar el recordatorio de contrasena a ${user.username}`, error);
        }
      }
    }

    return summary;
  }

  async enforceForLogin(user) {
    const policyState = getPolicyState(user);

    if (policyState.isExpired) {
      await this.blockExpiredUser(user);
      throw boom.unauthorized(
        'Tu contrasena vencio y tu usuario fue bloqueado. Debes recuperarla y cambiarla para volver a ingresar.'
      );
    }

    if (user.isBlock && user.password_blocked_at) {
      throw boom.unauthorized(
        'Tu usuario esta bloqueado por vencimiento de contrasena. Cambiala desde el flujo de recuperacion para desbloquearlo.'
      );
    }

    if (user.isBlock) {
      throw boom.unauthorized('El usuario esta deshabilitado, por favor comuniquese con el administrador');
    }
  }

  async startScheduler() {
    await this.runCycle();

    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.runCycle().catch((error) => {
          console.error('Password policy cycle failed', error);
        });
      }, POLICY_CHECK_INTERVAL_MS);
    }
  }

  async markPasswordChanged(username) {
    const user = await db.usuarios.findOne({ where: { username } });
    const nextIsBlock = user && user.password_blocked_at ? false : user && user.isBlock;

    await db.usuarios.update({
      isBlock: nextIsBlock,
      recovery_token: null,
      password_blocked_at: null,
      password_reminder_sent_at: null,
      password_changed_at: new Date(),
    }, {
      where: { username }
    });
  }
}

module.exports = {
  PasswordPolicyService,
  PASSWORD_MAX_AGE_DAYS,
  PASSWORD_REMINDER_DAYS,
  getPolicyState,
};
