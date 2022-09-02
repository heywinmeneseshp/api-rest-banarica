'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('traslados', 'observaciones', {
      field: 'observaciones',
      type: Sequelize.STRING,
      allowNull: true
    })

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('traslados', 'observaciones');
  }
};
