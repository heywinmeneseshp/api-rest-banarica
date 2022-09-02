'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('movimientos', 'respuesta', {
      field: 'respuesta',
      type: Sequelize.STRING,
      allowNull: true
    })

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('movimientos', 'respuesta');
  }
};
