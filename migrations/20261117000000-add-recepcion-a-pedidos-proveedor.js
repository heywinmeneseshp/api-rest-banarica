'use strict';

// Pedidos a proveedor: almacenes con los que se genero (para el encabezado del PDF) y control de
// recepcion (recibido, fecha y quien lo marco).
module.exports = {
  async up(queryInterface, Sequelize) {
    const columnas = await queryInterface.describeTable('pedidos_proveedor');
    if (!columnas.almacenes) {
      await queryInterface.addColumn('pedidos_proveedor', 'almacenes', { type: Sequelize.STRING(200), allowNull: true });
    }
    if (!columnas.recibido) {
      await queryInterface.addColumn('pedidos_proveedor', 'recibido', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    }
    if (!columnas.fecha_recibido) {
      await queryInterface.addColumn('pedidos_proveedor', 'fecha_recibido', { type: Sequelize.STRING(10), allowNull: true });
    }
    if (!columnas.recibido_por) {
      await queryInterface.addColumn('pedidos_proveedor', 'recibido_por', { type: Sequelize.STRING(80), allowNull: true });
    }
  },

  async down(queryInterface) {
    const columnas = await queryInterface.describeTable('pedidos_proveedor');
    for (const c of ['almacenes', 'recibido', 'fecha_recibido', 'recibido_por']) {
      if (columnas[c]) await queryInterface.removeColumn('pedidos_proveedor', c);
    }
  },
};
