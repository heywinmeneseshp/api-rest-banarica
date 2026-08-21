'use strict';

// Empresas.id se creo como INTEGER primaryKey pero SIN auto-incremento
// (migrations/20240811140440-create-empresa.js). El modelo Sequelize si
// asume auto-incremento (comportamiento por defecto al no declarar `id`
// explicitamente), asi que cualquier insert sin id explicito (ej.
// seeders/seed-empresa.js) dejaba MySQL insertar 0 en vez de generar un id
// real, y una segunda fila chocaba por PK duplicada o "doesn't have a
// default value" en modo estricto.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `Empresas` MODIFY `id` INT NOT NULL AUTO_INCREMENT;'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `Empresas` MODIFY `id` INT NOT NULL;'
    );
  },
};
