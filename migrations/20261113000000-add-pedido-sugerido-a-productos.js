'use strict';

// Cobertura de stock: permite excluir productos de las alertas y del pedido sugerido.
// Por defecto todos los productos entran (true), como hasta ahora.
module.exports = {
  async up(queryInterface, Sequelize) {
    const columnas = await queryInterface.describeTable('productos');
    if (!columnas.pedido_sugerido) {
      await queryInterface.addColumn('productos', 'pedido_sugerido', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },

  async down(queryInterface) {
    const columnas = await queryInterface.describeTable('productos');
    if (columnas.pedido_sugerido) {
      await queryInterface.removeColumn('productos', 'pedido_sugerido');
    }
  },
};
