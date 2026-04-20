const nodemailer = require('nodemailer');
const boom = require('@hapi/boom');
const env = require('../config/env');

class emailService {

  async send(datosCorreo) {
    const { destinatario, asunto, cuerpo, archivo } = datosCorreo;
    const adjuntos = [];

    if (archivo && archivo.contenido) {
      try {
        const fileBuffer = Buffer.from(archivo.contenido, 'base64');

        adjuntos.push({
          filename: archivo.nombre || 'archivo_adjunto',
          content: fileBuffer,
          contentType: archivo.tipo || 'application/octet-stream'
        });
      } catch (e) {
        console.warn('Error al decodificar Base64 o preparar el adjunto. Se enviara el correo sin archivo.');
      }
    }

    if (!env.email || !env.password) {
      throw boom.internal('El servicio de correo no esta configurado');
    }

    const infoEmail = {
      from: env.email,
      to: destinatario,
      subject: asunto,
      html: `<div>${cuerpo}</div>`,
      attachments: adjuntos
    };

    const transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.email,
        pass: env.password,
      }
    });

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
