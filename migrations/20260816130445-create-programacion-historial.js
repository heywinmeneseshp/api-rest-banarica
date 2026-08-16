'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('programacion_historial', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // Sin FK real a programacions: el registro de historial debe sobrevivir
      // aunque la fila original se elimine (delete() hace un hard delete).
      programacion_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      accion: {
        type: Sequelize.ENUM('creado', 'editado', 'eliminado'),
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
      bl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      semana: {
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

    await queryInterface.addIndex('programacion_historial', ['programacion_id']);
    await queryInterface.addIndex('programacion_historial', ['contenedor']);
    await queryInterface.addIndex('programacion_historial', ['bl']);
    await queryInterface.addIndex('programacion_historial', ['semana']);
    await queryInterface.addIndex('programacion_historial', ['usuario']);
    await queryInterface.addIndex('programacion_historial', ['accion']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('programacion_historial');
  }
};
