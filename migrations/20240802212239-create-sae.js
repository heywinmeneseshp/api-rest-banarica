'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SAEs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sae: {
        type: Sequelize.STRING
      },
      condicion_ubicacion: {
        type: Sequelize.INTEGER
      },
      condicion_combo: {
        type: Sequelize.INTEGER
      },
      id_embarque: {
        type: Sequelize.INTEGER
      },
      anuncio: {
        type: Sequelize.STRING
      },
      habilitado: {
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
    await queryInterface.dropTable('SAEs');
  }
};