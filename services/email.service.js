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
      await transporter.sendMail(infoEmail);
      return { success: true, message: 'Se ha enviado el correo exitosamente.' };
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      return { success: false, message: 'Error al enviar el correo.' };
    }
  }
}

module.exports = emailService;
