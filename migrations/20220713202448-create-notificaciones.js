'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notificaciones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        type: Sequelize.STRING
      },
      cons_almacen: {
        type: Sequelize.STRING
      },
      cons_movimiento: {
        type: Sequelize.STRING
      },
      aprobado: {
        type: Sequelize.BOOLEAN
      },
      visto: {
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
    await queryInterface.dropTable('notificaciones');
  }
};