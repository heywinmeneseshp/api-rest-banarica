const nodemailer = require('nodemailer');


class emailService {

  async send(destinatario, asunto, cuerpo) {
    
    const infoEmail = {
      from: 'meneses@craken.com.co',
      to: destinatario,
      subject: asunto,
      html: `<div>${cuerpo}</div>`
    }

    const transporter = nodemailer.createTransport({
      host: 'mail.craken.com.co',
      port: 465,
      secure: true,
      auth: {
        user: 'meneses@craken.com.co',
        pass: "UFkF@,{Ul(}P",
      }
    });
    await transporter.sendMail(infoEmail);
    return { message: "Se ha enviado un correo a tu cuenta de correo" }
  }
}

module.exports = emailService;