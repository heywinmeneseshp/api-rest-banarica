'use strict';

// Empresas.id se creo como INTEGER primaryKey pero SIN auto-incremento
// (migrations/20240811140440-create-empresa.js). El modelo Sequelize si
// asume auto-incremento (comportamiento por defecto al no declarar `id`
// explicitamente), asi que cualquier insert sin id explicito (ej. el viejo
// seeders/seed-empresa.js, antes de que se arreglara) dejaba MySQL insertar
// 0 en vez de generar un id real. Si eso paso mas de una vez, quedaron varias
// filas con id=0 (o algun otro id repetido) y el ALTER TABLE para agregar
// AUTO_INCREMENT falla con un error de clave duplicada (que Sequelize
// reporta como "ValidationError" via UniqueConstraintError). Por eso primero
// se deduplican los ids existentes y despues se aplica el AUTO_INCREMENT.
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    const [filas] = await sequelize.query(
      'SELECT id FROM `Empresas` ORDER BY id ASC, createdAt ASC;'
    );

    const vistos = new Set();
    let siguienteId = filas.reduce((max, f) => Math.max(max, Number(f.id) || 0), 0) + 1;

    // No hay forma confiable de identificar "la fila N" sin una columna unica
    // adicional, asi que se renumeran usando createdAt (unico por fila real)
    // como criterio de reasignacion.
    for (const fila of filas) {
      const id = Number(fila.id);
      if (vistos.has(id)) {
        await sequelize.query(
          'UPDATE `Empresas` SET id = ? WHERE id = ? LIMIT 1;',
          { replacements: [siguienteId, id] }
        );
        vistos.add(siguienteId);
        siguienteId += 1;
      } else {
        vistos.add(id);
      }
    }

    await sequelize.query(
      'ALTER TABLE `Empresas` MODIFY `id` INT NOT NULL AUTO_INCREMENT;'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `Empresas` MODIFY `id` INT NOT NULL;'
    );
  },
};
