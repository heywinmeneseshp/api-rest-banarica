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
      fecha: {
        type: Sequelize.STRING
      },
      ruta_id: {
        type: Sequelize.STRING
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
      activo: {
        type: Sequelize.BOOLEAN
      },
      movimiento: {
        type: Sequelize.STRING
      },
      conductor_id: {
        type: Sequelize.STRING
      },
      vehiculo_id: {
        type: Sequelize.STRING
      },
      contenedor: {
        type: Sequelize.STRING
      },
      semana: {
        type: Sequelize.STRING
      },
      llegada_oriegn: {
        type: Sequelize.STRING
      },
      salida_origen: {
        type: Sequelize.STRING
      },
      llegada_destino: {
        type: Sequelize.STRING
      },
      salida_oriegn: {
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
    await queryInterface.dropTable('programacions');
  }
};