'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('listado_historial', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // Sin FK real a Listados: el registro de historial debe sobrevivir aunque
      // la fila original se elimine con un hard delete.
      listado_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      accion: {
        type: Sequelize.ENUM('creado', 'editado', 'eliminado', 'restaurado'),
        allowNull: false
      },
      usuario: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contenedor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      datos_anteriores: {
        type: Sequelize.JSON,
        allowNull: true
      },
      datos_nuevos: {
        type: Sequelize.JSON,
        allowNull: true
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

    await queryInterface.addIndex('listado_historial', ['listado_id']);
    await queryInterface.addIndex('listado_historial', ['contenedor']);
    await queryInterface.addIndex('listado_historial', ['usuario']);
    await queryInterface.addIndex('listado_historial', ['accion']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('listado_historial');
  }
};
