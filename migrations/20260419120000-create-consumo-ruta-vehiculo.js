'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('consumo_ruta_vehiculo', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      vehiculo_id: {
        type: Sequelize.STRING
      },
      ruta_id: {
        type: Sequelize.STRING
      },
      consumo_por_km: {
        type: Sequelize.FLOAT
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.dropTable('consumo_ruta_vehiculo');
  }
};