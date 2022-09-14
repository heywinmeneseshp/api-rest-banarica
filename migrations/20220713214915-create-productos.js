'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('productos', {
      id: {
        unique: true,
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
        references: {
          model: "stock",
          key: "cons_producto"
        }
      },
      name: {
        type: Sequelize.STRING
      },
      bulto: {
        type: Sequelize.FLOAT
      },
      cons_categoria: {
        type: Sequelize.STRING,
        references: {
          model: 'categorias',
          key: 'consecutivo'
        }
      },
      cons_proveedor: {
        type: Sequelize.STRING
      },
      salida_sin_stock: {
        type: Sequelize.BOOLEAN
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
