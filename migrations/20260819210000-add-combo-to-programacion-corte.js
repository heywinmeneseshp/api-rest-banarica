'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('programacion_corte');
    if (!table.id_combo) {
      await queryInterface.addColumn('programacion_corte', 'id_combo', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'combos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('programacion_corte');
    if (table.id_combo) {
      await queryInterface.removeColumn('programacion_corte', 'id_combo');
    }
  },
};
