// migrations/YYYYMMDDHHMMSS-add-agente-zona-horas-to-inspeccion.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Rechazos', 'fecha_rechazo', {
      type: Sequelize.DATE,
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Rechazos', 'fecha_rechazo');
  }
};