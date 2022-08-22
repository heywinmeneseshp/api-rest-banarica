'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'recovery_token', {
      field: 'recovery_token',
      type: Sequelize.STRING,
      allowNull: true
    })

  },

  async down (queryInterface, Sequelize) {
     await queryInterface.removeColumn('usuarios', 'recovery_token');

  }
};
