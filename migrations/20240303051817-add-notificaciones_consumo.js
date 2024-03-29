// migrations/XXXXXXXXXXXXXX-add_email_to_usuario.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('notificaciones', 'dif_porcentual_consumo', {
      type: Sequelize.FLOAT,
      allowNull: true // O false si el email es obligatorio
    });
    await queryInterface.addColumn('notificaciones', 'id_vehiculo', {
      type: Sequelize.FLOAT,
      allowNull: true // O false si el email es obligatorio
    });
  },
  

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('notificaciones', 'dif_porcentual_consumo');
    await queryInterface.removeColumn('notificaciones', 'id_vehiculo');
  }
};
