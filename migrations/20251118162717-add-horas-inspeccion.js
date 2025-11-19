// migrations/YYYYMMDDHHMMSS-add-agente-zona-horas-to-inspeccion.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Inspeccions', 'agente', {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: 'Nombre del agente de policía'
    });

    await queryInterface.addColumn('Inspeccions', 'zona', {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: 'Zona de inspección'
    });

    await queryInterface.addColumn('Inspeccions', 'hora_inicio', {
      type: Sequelize.TIME,
      allowNull: false,
      comment: 'Hora de inicio de inspección'
    });

    await queryInterface.addColumn('Inspeccions', 'hora_fin', {
      type: Sequelize.TIME,
      allowNull: true, // Puede ser null si no ha finalizado
      comment: 'Hora de fin de inspección'
    });
    await queryInterface.addColumn('Inspeccions', 'observaciones', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Observaciones y comentarios de la inspección'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Inspeccions', 'agente');
    await queryInterface.removeColumn('Inspeccions', 'zona');
    await queryInterface.removeColumn('Inspeccions', 'hora_inicio');
    await queryInterface.removeColumn('Inspeccions', 'hora_fin');
  }
};