'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ubicaciones', 'cod', {
      type: Sequelize.STRING,
      allowNull: true  // O false si la columna no puede ser nula
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ubicaciones', 'cod');
  }
};
