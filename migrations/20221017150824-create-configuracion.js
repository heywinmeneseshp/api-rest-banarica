'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('configuracions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      modulo: {
        type: Sequelize.STRING,
        unique: true
      },
      habilitado: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('configuracions');
  }
};
