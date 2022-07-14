'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('productos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      cons_categoria: {
        type: Sequelize.STRING
      },
      cons_proveedor: {
        type: Sequelize.STRING
      },
      salida_sin_stock: {
        type: Sequelize.STRING
      },
      serial: {
        type: Sequelize.BOOLEAN
      },
      permitir_traslados: {
        type: Sequelize.BOOLEAN
      },
      costo: {
        type: Sequelize.FLOAT
      },
      isBlock: {
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
    await queryInterface.dropTable('productos');
  }
};