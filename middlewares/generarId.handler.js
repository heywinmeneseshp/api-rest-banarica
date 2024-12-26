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

function generarIDSemana(semana, anho) {
  return `S${semana}-${anho.slice(-2)}`;
}

function generarConsecutivoSemana(semana, anho) {
  const semanaConCero = semana.toString().padStart(2, '0');
  return `S${semanaConCero}-${anho}`;
}

module.exports = { generarID, generarIDProAndCat, generarIDSemana, generarConsecutivoSemana };
