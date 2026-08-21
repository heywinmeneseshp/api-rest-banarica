'use strict';

// Agrega movimiento_id (FK al catalogo tipo_movimiento_vehiculos) SIN quitar
// la columna de texto "movimiento" que ya existe: los reportes, exports y
// filtros actuales siguen leyendo el texto, y este id se usa para lo nuevo
// que necesite la relacion real (evita depender de comparar texto).
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('programacions');

    if (!table.movimiento_id) {
      await queryInterface.addColumn('programacions', 'movimiento_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    // Backfill: para cada fila existente, buscar el tipo_movimiento_vehiculos
    // cuyo texto coincide (sin importar mayusculas/espacios) con el texto ya
    // guardado en programacions.movimiento, y setear su id.
    await queryInterface.sequelize.query(`
      UPDATE programacions p
      INNER JOIN tipo_movimiento_vehiculos t
        ON LOWER(TRIM(p.movimiento)) = LOWER(TRIM(t.movimiento))
      SET p.movimiento_id = t.id
      WHERE p.movimiento_id IS NULL;
    `);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('programacions');
    if (table.movimiento_id) {
      await queryInterface.removeColumn('programacions', 'movimiento_id');
    }
  },
};
