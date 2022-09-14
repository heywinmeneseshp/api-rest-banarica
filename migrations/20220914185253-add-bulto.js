'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('productos', 'bulto', {
      field: 'bulto',
      type: Sequelize.FLOAT,
      allowNull: true
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('productos', 'bulto');
  }
};
