'use strict';

// Cobertura de stock: porcentaje propio de cada producto (null = usa el porcentaje general
// configurado en la tabla configuracion, modulo "CoberturaStock").
module.exports = {
  async up(queryInterface, Sequelize) {
    const columnas = await queryInterface.describeTable('productos');
    if (!columnas.cobertura_porcentaje) {
      await queryInterface.addColumn('productos', 'cobertura_porcentaje', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columnas = await queryInterface.describeTable('productos');
    if (columnas.cobertura_porcentaje) {
      await queryInterface.removeColumn('productos', 'cobertura_porcentaje');
    }
  },
};
