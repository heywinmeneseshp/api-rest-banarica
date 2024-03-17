'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('productos_viajes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      programacion_id: {
        type: Sequelize.STRING
      },
      producto_id: {
        type: Sequelize.STRING
      },
      unidad_de_medida: {
        type: Sequelize.STRING
      },
      cantidad: {
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
    await queryInterface.dropTable('productos_viajes');
  }
};