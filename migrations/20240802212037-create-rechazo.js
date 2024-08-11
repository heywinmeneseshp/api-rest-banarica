'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rechazos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_producto: {
        type: Sequelize.INTEGER
      },
      id_motivo_de_rechazo: {
        type: Sequelize.INTEGER
      },
      cantidad: {
        type: Sequelize.INTEGER
      },
      serial_palet: {
        type: Sequelize.STRING
      },
      cod_productor: {
        type: Sequelize.STRING
      },
      id_contenedor: {
        type: Sequelize.INTEGER
      },
      observaciones: {
        type: Sequelize.TEXT
      },
      id_usuario: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('Rechazos');
  }
};