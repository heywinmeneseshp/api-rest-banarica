'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('programacion_corte');

    if (!table.transportadora) {
      await queryInterface.addColumn('programacion_corte', 'transportadora', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!table.id_transportadora) {
      await queryInterface.addColumn('programacion_corte', 'id_transportadora', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('programacion_corte');
    if (table.transportadora) {
      await queryInterface.removeColumn('programacion_corte', 'transportadora');
    }
    if (table.id_transportadora) {
      await queryInterface.removeColumn('programacion_corte', 'id_transportadora');
    }
  },
};
