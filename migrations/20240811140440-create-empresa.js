'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Empresas', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      razonSocial: {
        type: Sequelize.STRING
      },
      nombreComercial: {
        type: Sequelize.STRING
      },
      nit: {
        type: Sequelize.STRING
      },
      domicilio: {
        type: Sequelize.STRING
      },
      correo: {
        type: Sequelize.STRING
      },
      telefono: {
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
    await queryInterface.dropTable('Empresas');
  }
};