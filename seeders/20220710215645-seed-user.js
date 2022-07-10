'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('usuarios', [{
      username: "heywinmeneses",
      nombre: "Heywin",
      apellido: "Meneses",
      email: "heywin1@gmail.com",
      password: "Banarica2022*",
      tel: "3226737763",
      id_rol: "sa",
      isBlock: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
