'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('movimientos', 'observaciones', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.changeColumn('movimientos', 'respuesta', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('movimientos', 'observaciones', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('movimientos', 'respuesta', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
