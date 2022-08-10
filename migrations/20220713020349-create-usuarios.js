'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: {
        unique: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      username: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      nombre: {
        type: Sequelize.STRING
      },
      apellido: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      tel: {
        type: Sequelize.STRING
      },
      id_rol: {
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
    await queryInterface.dropTable('usuarios');
  }
};
