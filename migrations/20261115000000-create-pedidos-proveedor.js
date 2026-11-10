'use strict';

// Pedidos a proveedor generados desde Seguridad > Disponibles > Cobertura y reposicion.
// Guarda el codigo del pedido (PP-00001...), el detalle y a quien se envio.
module.exports = {
  async up(queryInterface, Sequelize) {
    const tablas = await queryInterface.showAllTables();
    if (tablas.includes('pedidos_proveedor')) return;
    await queryInterface.createTable('pedidos_proveedor', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      codigo: { type: Sequelize.STRING(20), allowNull: true, unique: true },
      cons_proveedor: { type: Sequelize.STRING(40), allowNull: true },
      proveedor: { type: Sequelize.STRING(250), allowNull: true },
      usuario: { type: Sequelize.STRING(80), allowNull: true },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      detalle: { type: Sequelize.TEXT, allowNull: true },
      destinatarios: { type: Sequelize.STRING(500), allowNull: true },
      enviado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pedidos_proveedor');
  },
};
