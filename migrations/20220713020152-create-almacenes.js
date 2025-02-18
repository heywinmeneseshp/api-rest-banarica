'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('almacenes', {
      id: {
        unique: true,
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      nombre: {
        type: Sequelize.STRING
      },
      razon_social: {
        type: Sequelize.STRING
      },
      direccion: {
        type: Sequelize.STRING
      },
      telefono: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('almacenes');
  }
};
