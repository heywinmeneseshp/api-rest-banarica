'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si existen registros en la tabla Empresas.
    // OJO: usar == null (no !valor) — la tabla Empresas.id no tiene
    // auto-incremento, asi que un id valido puede ser 0, que es falsy y
    // rompia este chequeo (hacia pensar que no habia ninguna empresa e
    // insertaba de nuevo, chocando con la fila id=0 ya existente).
    const empresasExistentes = await queryInterface.rawSelect('Empresas', {}, 'id');

    if (empresasExistentes == null) {
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

  down: async (queryInterface) => {
    // Antes borraba TODAS las empresas (null, {}); ahora solo la que este
    // seeder pudo haber creado.
    return queryInterface.bulkDelete('Empresas', { nit: "123456789-0" }, {});
  }
};
