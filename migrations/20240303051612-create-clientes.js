'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clientes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      razon_social: {
        type: Sequelize.STRING,
        unique: true,
      },
      nit: {
        type: Sequelize.STRING,
        unique: true,
      },
      domicilio: {
        type: Sequelize.STRING
      },
      telefono: {
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING
      },
      activo: {
        type: Sequelize.BOOLEAN
      },
      cod: {
        type: Sequelize.STRING,
        allowNull: false, // Cambiar a false si la columna no puede ser nula
        unique: true
      },
      pais: {
        type: Sequelize.STRING,
        allowNull: true // Cambiar a false si la columna no puede ser nula
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
    await queryInterface.dropTable('clientes');
  }
};
