'use strict';

const { QueryTypes } = require('sequelize');

const MOVIMIENTO_REGEX = /\[MOVIMIENTO:([^\]]+)\]/;

module.exports = {
  async up(queryInterface) {
    const inspecciones = await queryInterface.sequelize.query(
      `
        SELECT id, observaciones
        FROM Inspeccions
        WHERE (cons_movimiento IS NULL OR cons_movimiento = '')
          AND observaciones IS NOT NULL
          AND observaciones LIKE '%[MOVIMIENTO:%]%'
      `,
      { type: QueryTypes.SELECT }
    );

    for (const inspeccion of inspecciones) {
      const match = String(inspeccion.observaciones || '').match(MOVIMIENTO_REGEX);
      const consMovimiento = match ? match[1].trim() : null;

      if (!consMovimiento) {
        continue;
      }

      await queryInterface.bulkUpdate(
        'Inspeccions',
        { cons_movimiento: consMovimiento },
        { id: inspeccion.id }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE Inspeccions
      SET cons_movimiento = NULL
      WHERE observaciones IS NOT NULL
        AND observaciones LIKE '%[MOVIMIENTO:%]%'
    `);
  }
};
