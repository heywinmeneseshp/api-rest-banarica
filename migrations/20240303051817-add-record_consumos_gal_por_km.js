// migrations/XXXXXXXXXXXXXX-add_email_to_usuario.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('record_consumos', 'gal_por_km', {
      type: Sequelize.FLOAT,
      allowNull: true // O false si el email es obligatorio
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('record_consumos', 'gal_por_km');
  }
};
