'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si existen registros en la tabla Empresas
    const empresasExistentes = await queryInterface.rawSelect('Empresas', {}, 'id');

    // Si no existen registros, insertar los datos
    if (!empresasExistentes) {
      return queryInterface.bulkInsert('Empresas', [{
        razonSocial: "Razón Social Ejemplo 1",
        nombreComercial: "Nombre Comercial 1",
        nit: "123456789-0",
        domicilio: "Calle Falsa 123",
        correo: "contacto@empresa1.com",
        telefono: "3009876543",
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Empresas', null, {});
  }
};
