'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Listados', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fecha: {
        type: Sequelize.DATE
      },
      id_embarque: {
        type: Sequelize.INTEGER
      },
      id_contenedor: {
        type: Sequelize.INTEGER
      },
      id_lugar_de_llenado: {
        type: Sequelize.INTEGER
      },
      id_producto: {
        type: Sequelize.INTEGER
      },
      cajas_unidades: {
        type: Sequelize.INTEGER
      },
      id_sae: {
        type: Sequelize.INTEGER
      },
      transbordado: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('Listados');
  }
};