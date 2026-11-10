'use strict';

// Segundo nombre del producto: como lo llama el proveedor. Es el que se muestra en el pedido
// sugerido por proveedor (si esta vacio se usa el nombre normal).
module.exports = {
  async up(queryInterface, Sequelize) {
    const columnas = await queryInterface.describeTable('productos');
    if (!columnas.nombre_proveedor) {
      await queryInterface.addColumn('productos', 'nombre_proveedor', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columnas = await queryInterface.describeTable('productos');
    if (columnas.nombre_proveedor) {
      await queryInterface.removeColumn('productos', 'nombre_proveedor');
    }
  },
};
