'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Inspeccions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_contenedor: {
        type: Sequelize.INTEGER
      },
      fecha_inspeccion: {
        type: Sequelize.DATE
      },
      agente: {
        type: Sequelize.STRING(100),
      },
      zona: {
        type: Sequelize.STRING(100),
      },
      hora_inicio: {
        type: Sequelize.TIME,

      },
      hora_fin: {
        type: Sequelize.TIME,
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('Inspeccions');
  }
};