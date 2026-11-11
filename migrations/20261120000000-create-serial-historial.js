'use strict';

// Historial de sobrescritura de seriales: cuando en Seguridad > Recepcion se carga un serial que ya
// existe, sus datos se actualizan y cada campo cambiado queda aqui (valor anterior, valor nuevo,
// motivo, observaciones, usuario y movimiento de recepcion).
module.exports = {
  async up(queryInterface, Sequelize) {
    const tablas = await queryInterface.showAllTables();
    if (tablas.includes('serial_historials')) return;
    await queryInterface.createTable('serial_historials', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      id_serial: { type: Sequelize.INTEGER, allowNull: false },
      serial: { type: Sequelize.STRING(150), allowNull: false },
      campo: { type: Sequelize.STRING(40), allowNull: false },
      valor_anterior: { type: Sequelize.STRING(255), allowNull: true },
      valor_nuevo: { type: Sequelize.STRING(255), allowNull: true },
      usado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      motivo: { type: Sequelize.STRING(255), allowNull: true },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      cons_movimiento: { type: Sequelize.STRING(40), allowNull: true },
      usuario: { type: Sequelize.STRING(80), allowNull: true },
      revertido: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('serial_historials', ['serial'], { name: 'idx_serial_historial_serial' });
    await queryInterface.addIndex('serial_historials', ['cons_movimiento'], { name: 'idx_serial_historial_mov' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('serial_historials');
  },
};
