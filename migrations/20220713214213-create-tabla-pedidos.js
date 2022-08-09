'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tabla_pedidos', {
      id: {
        unique: true,
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      pendiente: {
        type: Sequelize.BOOLEAN
      },
      observaciones: {
        type: Sequelize.STRING
      },
      fecha: {
        type: Sequelize.STRING
      },
      cons_semana: {
        type: Sequelize.STRING
      },
      usuario: {
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
    await queryInterface.dropTable('tabla_pedidos');
  }
};
