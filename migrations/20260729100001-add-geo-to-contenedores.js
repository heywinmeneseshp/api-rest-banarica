'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Contenedors', 'latitud_revision_puerto', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('Contenedors', 'longitud_revision_puerto', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Contenedors', 'latitud_revision_puerto');
    await queryInterface.removeColumn('Contenedors', 'longitud_revision_puerto');
  },
};
