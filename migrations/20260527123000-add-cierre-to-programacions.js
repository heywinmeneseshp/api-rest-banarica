'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('programacions');

    if (!table.cierre) {
      await queryInterface.addColumn('programacions', 'cierre', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('programacions');

    if (table.cierre) {
      await queryInterface.removeColumn('programacions', 'cierre');
    }
  },
};
