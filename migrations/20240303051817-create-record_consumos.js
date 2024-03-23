'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('record_consumos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fecha: {
        type: Sequelize.STRING
      },
      detalle: {
        type: Sequelize.STRING
      },
      semana: {
        type: Sequelize.STRING
      },
      vehiculo_id: {
        type: Sequelize.STRING
      },
      conductor_id: {
        type: Sequelize.STRING
      },
      stock_inicial: {
        type: Sequelize.FLOAT
      },
      stock_final: {
        type: Sequelize.FLOAT
      },
      stock_real: {
        type: Sequelize.FLOAT
      },
      tanqueo: {
        type: Sequelize.FLOAT
      },
      liquidado: {
        type: Sequelize.BOOLEAN
      },
      km_recorridos: {
        type: Sequelize.FLOAT
      },
      gal_por_km: {
        type: Sequelize.FLOAT
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
    await queryInterface.dropTable('record_consumos');
  }
};