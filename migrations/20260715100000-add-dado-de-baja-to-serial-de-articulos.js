'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('serial_de_articulos');

    if (!table.dado_de_baja) {
      await queryInterface.addColumn('serial_de_articulos', 'dado_de_baja', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('serial_de_articulos');

    if (table.dado_de_baja) {
      await queryInterface.removeColumn('serial_de_articulos', 'dado_de_baja');
    }
  }
};
