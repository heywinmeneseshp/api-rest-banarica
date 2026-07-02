'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('programacions');

    if (!table.llegada_patio) {
      await queryInterface.addColumn('programacions', 'llegada_patio', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.retiro_patio) {
      await queryInterface.addColumn('programacions', 'retiro_patio', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('programacions');

    if (table.retiro_patio) {
      await queryInterface.removeColumn('programacions', 'retiro_patio');
    }

    if (table.llegada_patio) {
      await queryInterface.removeColumn('programacions', 'llegada_patio');
    }
  },
};
