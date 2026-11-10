'use strict';

// Observacion predeterminada de los pedidos a cada proveedor (null = se usa la observacion
// general configurada en la tabla configuracion, modulo "CoberturaStock").
module.exports = {
  async up(queryInterface, Sequelize) {
    const columnas = await queryInterface.describeTable('proveedores');
    if (!columnas.observacion_pedido) {
      await queryInterface.addColumn('proveedores', 'observacion_pedido', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columnas = await queryInterface.describeTable('proveedores');
    if (columnas.observacion_pedido) {
      await queryInterface.removeColumn('proveedores', 'observacion_pedido');
    }
  },
};
