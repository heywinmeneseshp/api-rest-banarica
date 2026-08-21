'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Idempotente: antes hacia bulkInsert sin revisar si ya existia, asi que
    // correrlo dos veces duplicaba el producto "000".
    const existente = await queryInterface.rawSelect(
      'productos',
      { where: { consecutivo: '000' } },
      'consecutivo'
    );
    if (existente) return;

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

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('productos', { consecutivo: '000' }, {});
  }
};
