'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('historial_movimientos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cons_movimiento: {
        type: Sequelize.STRING
      },
      cons_producto: {
        type: Sequelize.STRING
      },
      cons_almacen_gestor: {
        type: Sequelize.STRING
      },
      cons_almacen_receptor: {
        type: Sequelize.STRING
      },
      cons_lista_movimientos: {
        type: Sequelize.STRING
      },
      tipo_movimiento: {
        type: Sequelize.STRING
      },
      razon_movimiento: {
        type: Sequelize.STRING
      },
      cantidad: {
        type: Sequelize.FLOAT
      },
      cons_pedido: {
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
    await queryInterface.dropTable('historial_movimientos');
  }
};