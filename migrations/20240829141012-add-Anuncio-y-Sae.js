'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Embarques', 'anuncio', {
      type: Sequelize.STRING,
      allowNull: true, // Puedes cambiar a false si quieres que sea un campo obligatorio
    });
    await queryInterface.addColumn('Embarques', 'sae', {
      type: Sequelize.STRING,
      allowNull: true, // Puedes cambiar a false si quieres que sea un campo obligatorio
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Embarques', 'anuncio');
    await queryInterface.removeColumn('Embarques', 'sae');
  }
};
