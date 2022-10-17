'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.addColumn('serial_de_articulos', 'cons_movimiento', {
      field: 'cons_movimiento',
      type: Sequelize.STRING,
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
    await queryInterface.removeColumn('serial_de_articulos', 'cons_movimiento');
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
