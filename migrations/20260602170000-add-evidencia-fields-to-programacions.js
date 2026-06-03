'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('programacions');

    if (!table.evidencia_cargada) {
      await queryInterface.addColumn('programacions', 'evidencia_cargada', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!table.evidencia_carpeta_id) {
      await queryInterface.addColumn('programacions', 'evidencia_carpeta_id', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.evidencia_carpeta_url) {
      await queryInterface.addColumn('programacions', 'evidencia_carpeta_url', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.evidencia_fecha) {
      await queryInterface.addColumn('programacions', 'evidencia_fecha', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table.evidencia_total_fotos) {
      await queryInterface.addColumn('programacions', 'evidencia_total_fotos', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('programacions');

    if (table.evidencia_total_fotos) {
      await queryInterface.removeColumn('programacions', 'evidencia_total_fotos');
    }

    if (table.evidencia_fecha) {
      await queryInterface.removeColumn('programacions', 'evidencia_fecha');
    }

    if (table.evidencia_carpeta_url) {
      await queryInterface.removeColumn('programacions', 'evidencia_carpeta_url');
    }

    if (table.evidencia_carpeta_id) {
      await queryInterface.removeColumn('programacions', 'evidencia_carpeta_id');
    }

    if (table.evidencia_cargada) {
      await queryInterface.removeColumn('programacions', 'evidencia_cargada');
    }
  },
};