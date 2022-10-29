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
      semana_actual: {
        type: Sequelize.INTEGER
      },
      semana_siguiente: {
        type: Sequelize.INTEGER
      },
      semana_previa: {
        type: Sequelize.INTEGER
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
