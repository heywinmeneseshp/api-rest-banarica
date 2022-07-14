'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('semanas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        type: Sequelize.STRING
      },
      semana: {
        type: Sequelize.STRING
      },
      anho: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('semanas');
  }
};