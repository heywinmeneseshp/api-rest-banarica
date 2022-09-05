const fs = require("fs")

class PDFService {

  async delete(filepath) {
    fs.exists(filepath, function (exists) {
      if (exists) {
        fs.unlink(filepath, function (err) {
          if (err) {
            throw { message: "Ha ocurrido un error al eliminar el archivo" + err.message }
          } else {
            console.log("Archivo satisfactoriamente eliminado")
          }
        })
      } else {
        console.log("El archivo no existe, por lo tanto no se puede borrar");
      }
    })
  }
}

module.exports = PDFService
