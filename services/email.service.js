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
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'soporteapplog@gmail.com',
        pass: "jpuw qhoc xgzc cvlg",
      }
    });
    await transporter.sendMail(infoEmail);
    return { message: "Se ha enviado un correo a tu cuenta de correo" }
  }
}

module.exports = emailService;