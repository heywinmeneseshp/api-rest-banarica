'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('programacions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      itininerario_id: {
        type: Sequelize.STRING
      },
      ruta_id: {
        type: Sequelize.STRING
      },
      producto_id: {
        type: Sequelize.STRING
      },
      cantidad: {
        type: Sequelize.FLOAT
      },
      detalles: {
        type: Sequelize.STRING
      },
      cobrar: {
        type: Sequelize.BOOLEAN
      },
      id_pagador_flete: {
        type: Sequelize.STRING
      },
      unidad_medida: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('programacions');
  }
};