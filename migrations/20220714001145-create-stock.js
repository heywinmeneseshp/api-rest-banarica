'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stocks', {
      id: {
        unique: true,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      cons_almacen: {
        type: Sequelize.STRING,
        references: {
          model: 'almacenes',
          key: 'consecutivo'
        }
      },
      cons_producto: {
        type: Sequelize.STRING,
        references: {
          model: 'productos',
          key: 'consecutivo'
        }
      },
      cantidad: {
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
    await queryInterface.dropTable('stocks');
  }
};
