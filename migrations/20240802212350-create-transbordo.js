'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transbordos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_contenedor_viejo: {
        type: Sequelize.INTEGER
      },
      id_contenedor_nuevo: {
        type: Sequelize.INTEGER
      },
      fecha_transbordo: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('Transbordos');
  }
};