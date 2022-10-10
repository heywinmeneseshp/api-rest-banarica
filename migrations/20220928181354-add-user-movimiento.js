'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('historial_movimientos', 'realizado_por', {
      field: 'realizado_por',
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addColumn('historial_movimientos', 'aprobado_por', {
      field: 'realizado_por',
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('historial_movimientos', 'realizado_por');
    await queryInterface.removeColumn('historial_movimientos', 'aprobado_por');
  }
};
