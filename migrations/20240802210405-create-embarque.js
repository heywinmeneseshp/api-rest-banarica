'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Embarques', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_semana: {
        type: Sequelize.INTEGER
      },
      id_cliente: {
        type: Sequelize.INTEGER
      },
      id_destino: {
        type: Sequelize.INTEGER
      },
      id_naviera: {
        type: Sequelize.INTEGER
      },
      viaje: {
        type: Sequelize.STRING
      },
      id_buque: {
        type: Sequelize.INTEGER
      },
      booking: {
        type: Sequelize.STRING
      },
      bl: {
        type: Sequelize.STRING
      },
      fecha_zarpe: {
        type: Sequelize.DATE
      },
      fecha_arribo: {
        type: Sequelize.DATE
      },
      observaciones: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('Embarques');
  }
};