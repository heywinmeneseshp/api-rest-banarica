// migrations/XXXXXXXXXXXXXX-add_email_to_usuario.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('configuracions', 'mes_reporte', {
      type: Sequelize.INTEGER,
      allowNull: true // O false si el email es obligatorio
    });
    await queryInterface.addColumn('configuracions', 'sem_reporte', {
      type: Sequelize.INTEGER,
      allowNull: true // O false si el email es obligatorio
    });
    await queryInterface.addColumn('configuracions', 'email_reporte', {
      type: Sequelize.STRING,
      allowNull: true // O false si el email es obligatorio
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('configuracions', 'mes_reporte');
    await queryInterface.removeColumn('configuracions', 'sem_reporte');
    await queryInterface.removeColumn('configuracions', 'email_reporte');
  }
};
