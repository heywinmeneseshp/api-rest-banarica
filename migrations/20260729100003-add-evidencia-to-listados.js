'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Listados', 'evidencia_cargada', { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: null });
    await queryInterface.addColumn('Listados', 'evidencia_carpeta_id', { type: Sequelize.STRING, allowNull: true, defaultValue: null });
    await queryInterface.addColumn('Listados', 'evidencia_carpeta_url', { type: Sequelize.STRING, allowNull: true, defaultValue: null });
    await queryInterface.addColumn('Listados', 'evidencia_fecha', { type: Sequelize.DATE, allowNull: true, defaultValue: null });
    await queryInterface.addColumn('Listados', 'evidencia_total_fotos', { type: Sequelize.INTEGER, allowNull: true, defaultValue: null });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Listados', 'evidencia_cargada');
    await queryInterface.removeColumn('Listados', 'evidencia_carpeta_id');
    await queryInterface.removeColumn('Listados', 'evidencia_carpeta_url');
    await queryInterface.removeColumn('Listados', 'evidencia_fecha');
    await queryInterface.removeColumn('Listados', 'evidencia_total_fotos');
  },
};
