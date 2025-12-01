// En tu archivo emailService.js
const nodemailer = require('nodemailer');

class emailService {

  async send(datosCorreo) {
    
    // Desestructurar los datos, incluyendo 'archivo'
    const { destinatario, asunto, cuerpo, archivo } = datosCorreo;
    
    // 1. Inicializar la lista de adjuntos vacía
    const adjuntos = [];
    
    // 2. Comprobar si existe el objeto 'archivo' y si tiene contenido Base64
    if (archivo && archivo.contenido) {
        
        try {
            // Decodificar el contenido Base64
            const fileBuffer = Buffer.from(archivo.contenido, 'base64');

            // Agregar el adjunto a la lista
            adjuntos.push({
                filename: archivo.nombre || 'archivo_adjunto', // Usa un nombre por defecto si no viene
                content: fileBuffer,
                contentType: archivo.tipo || 'application/octet-stream' // Usa un tipo MIME por defecto
            });
        } catch (e) {
            console.warn("Error al decodificar Base64 o preparar el adjunto. Se enviará el correo sin archivo.");
            // Si hay error en la decodificación, simplemente no se adjunta.
        }
    }

    const infoEmail = {
      from: 'meneses@craken.com.co',
      to: destinatario,
      subject: asunto,
      html: `<div>${cuerpo}</div>`,
      
      // 3. Nodemailer adjuntará solo si la lista 'adjuntos' no está vacía
      attachments: adjuntos 
    }

    const transporter = nodemailer.createTransport({
      // ... configuración de transporte
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'soporteapplog@gmail.com',
        pass: "cevx bfse uygu evne",
      }
    });

    try {
      await transporter.sendMail(infoEmail);
      return { success: true, message: "Se ha enviado el correo exitosamente." }
    } catch (error) {
      console.error("Error al enviar el correo:", error);
      return { success: false, message: "Error al enviar el correo." }
    }
  }
}

module.exports = emailService;