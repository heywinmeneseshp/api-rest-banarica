'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Idempotente: si ya existe un usuario con este username, no hace nada
    // (antes hacia bulkInsert sin revisar, asi que correr este seeder una
    // segunda vez fallaba por username duplicado).
    const existente = await queryInterface.rawSelect(
      'usuarios',
      { where: { username: 'admin' } },
      'username'
    );
    if (existente) return;

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

  down: async (queryInterface) => {
    // Antes decia 'Users' (tabla que no existe en este proyecto, es 'usuarios').
    return queryInterface.bulkDelete('usuarios', { username: 'admin' }, {});
  }
};
