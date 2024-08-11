'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clientes', 'cod', {
      type: Sequelize.STRING,
      allowNull: true  // O false si la columna no puede ser nula
    });

    await queryInterface.addColumn('clientes', 'pais', {
      type: Sequelize.STRING,
      allowNull: true  // O false si la columna no puede ser nula
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clientes', 'cod');
    await queryInterface.removeColumn('clientes', 'pais');
  }
};
