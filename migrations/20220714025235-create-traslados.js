'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('traslados', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        type: Sequelize.STRING
      },
      transportadora: {
        type: Sequelize.STRING
      },
      conductor: {
        type: Sequelize.STRING
      },
      vehiculo: {
        type: Sequelize.STRING
      },
      origen: {
        type: Sequelize.STRING
      },
      destino: {
        type: Sequelize.STRING
      },
      semana: {
        type: Sequelize.STRING
      },
      fecha_salida: {
        type: Sequelize.STRING
      },
      fecha_entrada: {
        type: Sequelize.STRING
      },
      estado: {
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
    await queryInterface.dropTable('traslados');
  }
};