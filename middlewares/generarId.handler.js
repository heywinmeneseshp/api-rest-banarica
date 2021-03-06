function generarID(prefijo, ultimoID) {
  let id = ultimoID.split("-")[1];
  id = parseInt(id) + 1;
  return prefijo + "-" + id
}

function generarIDProAndCat (nombre, ultimoID) {
  let prefijo = (nombre.substring(0, 3)).toUpperCase();
  let id = ultimoID.substring(3, nombre.length);
  id = parseInt(id) + 1;
  return prefijo + id
}

function generarIDSemana(semana, anho){ //S20-22
  let id = "S" + semana + "-" + anho.substring(2, 4);
  return id;
}

module.exports = { generarID, generarIDProAndCat, generarIDSemana };
