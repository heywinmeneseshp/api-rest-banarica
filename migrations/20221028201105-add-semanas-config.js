'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('configuracions', 'semana_previa', {
      field: 'semana_previa',
      type: Sequelize.INTEGER,
      allowNull: true
    })
    await queryInterface.addColumn('configuracions', 'semana_siguiente', {
      field: 'semana_siguiente',
      type: Sequelize.INTEGER,
      allowNull: true
    })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('configuracions', 'semana_siguiente');

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
