'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('almacenes_por_usuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_almacen: {
        type: Sequelize.STRING
      },
      username: {
        type: Sequelize.STRING
      },
      habilitado: {
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
    await queryInterface.dropTable('almacenes_por_usuarios');
  }
};