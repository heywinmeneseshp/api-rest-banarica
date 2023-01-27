const nodemailer = require('nodemailer');


class emailService {

  async send(destinatario, asunto, cuerpo) {
    
    const infoEmail = {
      from: 'appbanarica@gmail.com',
      to: destinatario,
      subject: asunto,
      html: `<div>${cuerpo}</div>`
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'appbanarica@gmail.com',
        pass: "tgedwrkiqqzlizqf",
      }
    });
    await transporter.sendMail(infoEmail);
    return { message: "Se ha enviado un correo a tu cuenta de correo" }
  }
}

module.exports = emailService;