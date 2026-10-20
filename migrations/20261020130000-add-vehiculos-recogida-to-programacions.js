'use strict';

// Vehiculos adicionales de un movimiento (cantidad indefinida): cuando un
// contenedor lo lleva un vehiculo y lo retira otro, "vehiculo_id" es el
// vehiculo de retiro y aqui se guarda, como lista JSON de ids de vehiculo
// (["12","30"]), el/los vehiculos de recogida. Es opcional.
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('programacions');
    if (!table.vehiculos_recogida) {
      await queryInterface.addColumn('programacions', 'vehiculos_recogida', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('programacions');
    if (table.vehiculos_recogida) {
      await queryInterface.removeColumn('programacions', 'vehiculos_recogida');
    }
  },
};
