// migrations/XXXXXXXXXXXXXX-add_email_to_usuario.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('configuracions', 'detalles', {
      type: Sequelize.STRING,
      allowNull: true // O false si el email es obligatorio
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('configuracions', 'detalles');
  }
};
