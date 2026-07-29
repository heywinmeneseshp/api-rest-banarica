'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE Contenedors c
      INNER JOIN (
        SELECT id_contenedor, MAX(updatedAt) AS ultima_revision
        FROM serial_de_articulos
        WHERE revisado = 1
          AND id_contenedor IS NOT NULL
        GROUP BY id_contenedor
      ) s ON s.id_contenedor = c.id
      SET c.hora_revision_puerto = s.ultima_revision
      WHERE c.hora_revision_puerto IS NULL
    `);
  },

  async down() {
    // backfill no es reversible
  },
};
