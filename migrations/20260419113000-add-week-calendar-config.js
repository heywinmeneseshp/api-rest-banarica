'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('configuracions', 'fecha_inicio_semana_1', {
      allowNull: true,
      type: Sequelize.DATEONLY,
    });

    await queryInterface.addColumn('configuracions', 'total_semanas_anho', {
      allowNull: true,
      type: Sequelize.INTEGER,
    });

    await queryInterface.addColumn('semanas', 'fecha_inicio', {
      allowNull: true,
      type: Sequelize.DATEONLY,
    });

    await queryInterface.addColumn('semanas', 'fecha_fin', {
      allowNull: true,
      type: Sequelize.DATEONLY,
    });

    await queryInterface.addColumn('semanas', 'dias_semana', {
      allowNull: true,
      type: Sequelize.INTEGER,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('semanas', 'dias_semana');
    await queryInterface.removeColumn('semanas', 'fecha_fin');
    await queryInterface.removeColumn('semanas', 'fecha_inicio');
    await queryInterface.removeColumn('configuracions', 'total_semanas_anho');
    await queryInterface.removeColumn('configuracions', 'fecha_inicio_semana_1');
  }
};
