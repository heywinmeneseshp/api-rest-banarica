'use strict';

// Backfill de movimiento_id (agregado en 20260821130000) para filas viejas
// cuyo texto de movimiento ya no existe tal cual en el catalogo actual
// tipo_movimiento_vehiculos:
//   - "Camion Puerto" -> siempre se mapea a "Puerto".
//   - "Contenedor"    -> si la fila tiene numero de contenedor, es "Finca"
//                        (viaja con contenedor asignado); si no tiene
//                        contenedor, es "Puerto" (no requiere contenedor).
// Solo toca filas con movimiento_id todavia NULL — no pisa nada que ya haya
// quedado bien resuelto por el backfill automatico de la migracion anterior.
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      UPDATE programacions p
      INNER JOIN tipo_movimiento_vehiculos t ON t.movimiento = 'Puerto'
      SET p.movimiento_id = t.id
      WHERE p.movimiento_id IS NULL
        AND LOWER(TRIM(p.movimiento)) = 'camión puerto';
    `);

    await sequelize.query(`
      UPDATE programacions p
      INNER JOIN tipo_movimiento_vehiculos t ON t.movimiento = 'Finca'
      SET p.movimiento_id = t.id
      WHERE p.movimiento_id IS NULL
        AND LOWER(TRIM(p.movimiento)) = 'contenedor'
        AND p.contenedor IS NOT NULL
        AND TRIM(p.contenedor) <> '';
    `);

    await sequelize.query(`
      UPDATE programacions p
      INNER JOIN tipo_movimiento_vehiculos t ON t.movimiento = 'Puerto'
      SET p.movimiento_id = t.id
      WHERE p.movimiento_id IS NULL
        AND LOWER(TRIM(p.movimiento)) = 'contenedor'
        AND (p.contenedor IS NULL OR TRIM(p.contenedor) = '');
    `);
  },

  async down() {
    // No se revierte: no hay forma de distinguir estas filas de las que ya
    // tenian movimiento_id resuelto de otra forma.
  },
};
