'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('combos', 'id_cliente', {
      type: Sequelize.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });

    await queryInterface.addColumn('combos', 'cajas_por_palet', {
      type: Sequelize.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });

    await queryInterface.addColumn('combos', 'cajas_por_mini_palet', {
      type: Sequelize.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });

    await queryInterface.addColumn('combos', 'palets_por_contenedor', {
      type: Sequelize.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });

    await queryInterface.addColumn('combos', 'peso_neto', {
      type: Sequelize.FLOAT,  // O DECIMAL si necesitas precisión
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });

    await queryInterface.addColumn('combos', 'peso_bruto', {
      type: Sequelize.FLOAT,  // O DECIMAL si necesitas precisión
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });

    await queryInterface.addColumn('combos', 'precio_de_venta', {
      type: Sequelize.FLOAT,  // O DECIMAL si necesitas precisión
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('combos', 'id_cliente');
    await queryInterface.removeColumn('combos', 'cajas_por_palet');
    await queryInterface.removeColumn('combos', 'cajas_por_mini_palet');
    await queryInterface.removeColumn('combos', 'palets_por_contenedor');
    await queryInterface.removeColumn('combos', 'peso_neto');
    await queryInterface.removeColumn('combos', 'peso_bruto');
    await queryInterface.removeColumn('combos', 'precio_de_venta');
  }
};
