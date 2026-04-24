'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const candidates = await queryInterface.sequelize.query(
      `
        SELECT
          i.id,
          MIN(s.cons_movimiento) AS cons_movimiento
        FROM Inspeccions i
        INNER JOIN serial_de_articulos s
          ON s.id_contenedor = i.id_contenedor
         AND s.fecha_de_uso = i.fecha_inspeccion
         AND s.available = 0
         AND s.cons_movimiento IS NOT NULL
        INNER JOIN MotivoDeUsos mu
          ON mu.id = s.id_motivo_de_uso
         AND mu.consecutivo IN ('INSP01', 'INSP02')
        WHERE (i.cons_movimiento IS NULL OR i.cons_movimiento = '')
        GROUP BY i.id
        HAVING COUNT(DISTINCT s.cons_movimiento) = 1
      `,
      { type: QueryTypes.SELECT }
    );

    for (const candidate of candidates) {
      if (!candidate.cons_movimiento) {
        continue;
      }

      await queryInterface.bulkUpdate(
        'Inspeccions',
        { cons_movimiento: candidate.cons_movimiento },
        { id: candidate.id }
      );
    }
  },

  async down() {
    // Backfill conservador de datos historicos: no se revierte automaticamente
    // para evitar borrar relaciones validas ya consolidadas.
  }
};
