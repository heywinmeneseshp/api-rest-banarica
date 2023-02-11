'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('etiqueta', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        type: Sequelize.STRING
      },
      producto: {
        type: Sequelize.STRING
      },
      gnl: {
        type: Sequelize.STRING
      },
      ean13: {
        type: Sequelize.STRING
      },
      detalle_inferior: {
        type: Sequelize.STRING
      },
      detalle_superior: {
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
    await queryInterface.dropTable('etiqueta');
  }
};