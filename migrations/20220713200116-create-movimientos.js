'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movimientos', {
      id: {
        unique: true,
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      remision: {
        type: Sequelize.STRING
      },
      pendiente: {
        type: Sequelize.BOOLEAN
      },
      observaciones: {
        type: Sequelize.STRING
      },
      respuesta: {
        type: Sequelize.STRING
      },
      cons_semana: {
        type: Sequelize.STRING
      },
      aprobado_por: {
        type: Sequelize.STRING
      }, fecha: {
        type: Sequelize.STRING
      },
      realizado_por: {
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
    await queryInterface.dropTable('movimientos');
  }
};
