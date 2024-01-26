'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('usuarios', [{
      username: "admin",
      nombre: "Administrador",
      apellido: "Admin",
      email: "meneses@craken.com.co",
      password: "$2a$10$TJeiLu9PWfce9JmLmEZjKe6tmGZab4ClSakBPvwt4B.BO5rSuYY4e",
      tel: "3001234569",
      id_rol: "Super administrador",
      isBlock: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
