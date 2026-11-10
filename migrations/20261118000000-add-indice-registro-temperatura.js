'use strict';

// Acelera la carga masiva de temperatura (deteccion de lecturas repetidas) y las consultas por
// serial: indice (id_serial_articulo, fecha, hora). No es unico, para no fallar con datos repetidos
// que ya existan.
const NOMBRE = 'idx_registro_temperatura_serial_fecha_hora';

module.exports = {
  async up(queryInterface) {
    const indices = await queryInterface.showIndex('RegistroTemperaturas');
    if (indices.some((i) => i.name === NOMBRE)) return;
    await queryInterface.addIndex('RegistroTemperaturas', ['id_serial_articulo', 'fecha', 'hora'], { name: NOMBRE });
  },

  async down(queryInterface) {
    const indices = await queryInterface.showIndex('RegistroTemperaturas');
    if (indices.some((i) => i.name === NOMBRE)) {
      await queryInterface.removeIndex('RegistroTemperaturas', NOMBRE);
    }
  },
};
