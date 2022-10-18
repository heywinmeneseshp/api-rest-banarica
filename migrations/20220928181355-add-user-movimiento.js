'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('movimientos', 'realizado_por', {
      field: 'realizado_por',
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addColumn('movimientos', 'aprobado_por', {
      field: 'aprobado_por',
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('movimientos', 'realizado_por');
    await queryInterface.removeColumn('movimientos', 'aprobado_por');
  }
};
