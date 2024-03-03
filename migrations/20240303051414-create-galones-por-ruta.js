'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('galones_por_ruta', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ruta_id: {
        type: Sequelize.STRING
      },
      categoria_id: {
        type: Sequelize.STRING
      },
      galones_por_ruta: {
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
    await queryInterface.dropTable('galones_por_ruta');
  }
};