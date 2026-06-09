'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('vehiculos', 'transportadoraId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'transportadoras',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('vehiculos', 'transportadoraId');
  }
};
