'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('productos', [{
      consecutivo: '000',
      name: 'Predeterminado',
      bulto: 0,
      cons_categoria: null,
      cons_proveedor: "000",
      salida_sin_stock: false,
      serial: false,
      permitir_traslados: false,
      costo: 0,
      isBlock: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('productos', null, {});
  }
};
