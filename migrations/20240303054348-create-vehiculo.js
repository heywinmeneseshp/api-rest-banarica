'use strict';

const { sequelize } = require("../models");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehiculos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      vehiculo: {
        type: Sequelize.STRING
      },
      modelo: {
        type: Sequelize.STRING
      },
      placa: {
        type: Sequelize.STRING
      },
      conductor_id: {
        type: Sequelize.STRING
      },
      categoria_id: {
        type: Sequelize.STRING
      },
      combustible: {
        type: Sequelize.FLOAT
      },
      gal_por_km: {
        type: sequelize.FLOAT
      },
      activo: {
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
    await queryInterface.dropTable('vehiculos');
  }
};