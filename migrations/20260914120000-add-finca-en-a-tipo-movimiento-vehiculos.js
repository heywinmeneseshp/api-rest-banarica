'use strict';

// Antes, si la finca del proceso de empaque iba en origen o en destino del
// viaje sugerido dependia de "requiere_contenedor" — un campo pensado para
// otra cosa (si el movimiento necesita contenedor o no), reutilizado tambien
// para esto. Se separan en dos campos independientes para poder combinarlos
// libremente (ej. un movimiento con contenedor Y finca en origen).
//
// El backfill preserva el comportamiento actual de cada tipo de movimiento
// ya existente: los que hoy requieren contenedor (finca iba a destino)
// quedan en 'destino'; el resto (finca iba a origen) queda en el default
// 'origen'. Nadie tiene que reconfigurar nada para que siga funcionando
// igual que antes del deploy.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tipo_movimiento_vehiculos', 'finca_en', {
      type: Sequelize.ENUM('origen', 'destino'),
      allowNull: false,
      defaultValue: 'origen',
    });

    await queryInterface.sequelize.query(
      "UPDATE tipo_movimiento_vehiculos SET finca_en = 'destino' WHERE requiere_contenedor = true"
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tipo_movimiento_vehiculos', 'finca_en');
  },
};
