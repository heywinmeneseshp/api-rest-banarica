const nodemailer = require('nodemailer');
const boom = require('@hapi/boom');
const ConfigService = require('./configuracion.service');
const configService = new ConfigService();

class emailService {
  async getEmailConfig() {
    return await configService.findEmailConfig();
  }

  normalizePayload(datosCorreo, asunto, cuerpo) {
    if (typeof datosCorreo === 'string') {
      return {
        destinatario: datosCorreo,
        asunto,
        cuerpo,
      };
    }

    return datosCorreo || {};
  }

  buildTransporter(config) {
    return nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      auth: {
        user: config.email_correo,
        pass: config.password_correo,
      }
    });
  }

  buildFrom(config) {
    const fromName = config.email_from_name || 'Bana Rica';
    return `"${fromName}" <${config.email_correo}>`;
  }

  getSafeErrorMessage(error) {
    if (error?.code === 'EAUTH') {
      return 'Autenticacion SMTP fallida. Revisa el correo remitente y la contrasena/app password.';
    }

    if (error?.code === 'ECONNECTION' || error?.code === 'ETIMEDOUT' || error?.code === 'ESOCKET') {
      return 'No fue posible conectar con el servidor SMTP. Revisa host, puerto, SSL/TLS o la red del servidor.';
    }

    if (error?.responseCode === 535) {
      return 'El servidor SMTP rechazo las credenciales. Usa una app password si el correo tiene doble factor.';
    }

    if (error?.responseCode === 550 || error?.responseCode === 553) {
      return 'El servidor SMTP rechazo el destinatario o el remitente.';
    }

    return error?.message || 'Error al enviar el correo.';
  }

  async send(datosCorreo, asunto, cuerpo) {
    const payload = this.normalizePayload(datosCorreo, asunto, cuerpo);
    const { destinatario, archivo, archivos } = payload;
    const adjuntos = [];
    const htmlBody = payload.cuerpo || payload.html || '';
    const subject = payload.asunto || '';

    const archivosNormalizados = Array.isArray(archivos) && archivos.length > 0
      ? archivos
      : (archivo ? [archivo] : []);

    for (const item of archivosNormalizados) {
      if (!item?.contenido) {
        continue;
      }

      try {
        const fileBuffer = Buffer.from(item.contenido, 'base64');

        adjuntos.push({
          filename: item.nombre || 'archivo_adjunto',
          content: fileBuffer,
          contentType: item.tipo || 'application/octet-stream'
        });
      } catch (e) {
        console.warn('Error al decodificar Base64 o preparar el adjunto. Se omitira ese archivo.');
      }
    }

    const config = await this.getEmailConfig();

    if (!config.email_correo || !config.password_correo) {
      throw boom.internal('El servicio de correo no esta configurado');
    }

    if (!destinatario || !String(destinatario).trim()) {
      throw boom.badRequest('Debes indicar al menos un destinatario para enviar el correo');
    }

    if (!subject || !String(subject).trim()) {
      throw boom.badRequest('Debes indicar el asunto del correo');
    }

    const infoEmail = {
      from: this.buildFrom(config),
      to: destinatario,
      subject,
      html: `<div>${htmlBody}</div>`,
      attachments: adjuntos
    };

    if (payload.cc) {
      infoEmail.cc = payload.cc;
    }

    const transporter = this.buildTransporter(config);

    try {
      const info = await transporter.sendMail(infoEmail);
      return {
        success: true,
        message: 'Se ha enviado el correo exitosamente.',
        accepted: info.accepted || [],
        rejected: info.rejected || []
      };
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      return {
        success: false,
        message: this.getSafeErrorMessage(error),
        code: error?.code,
        responseCode: error?.responseCode
      };
    }
  }
}

module.exports = emailService;
