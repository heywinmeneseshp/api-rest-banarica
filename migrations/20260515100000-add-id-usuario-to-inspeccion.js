'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Inspeccions', 'id_usuario', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE Inspeccions i
      LEFT JOIN serial_de_articulos s
        ON s.cons_movimiento = i.cons_movimiento
        AND s.available = 0
      LEFT JOIN MotivoDeUsos mu
        ON mu.id = s.id_motivo_de_uso
      SET i.id_usuario = s.id_usuario
      WHERE i.id_usuario IS NULL
        AND s.id_usuario IS NOT NULL
        AND mu.consecutivo = 'INSP02'
    `);

    await queryInterface.sequelize.query(`
      UPDATE Inspeccions i
      LEFT JOIN serial_de_articulos s
        ON s.id_contenedor = i.id_contenedor
        AND s.available = 0
      LEFT JOIN MotivoDeUsos mu
        ON mu.id = s.id_motivo_de_uso
      SET i.id_usuario = s.id_usuario
      WHERE i.id_usuario IS NULL
        AND s.id_usuario IS NOT NULL
        AND mu.consecutivo IN ('INSP01', 'INSP02')
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Inspeccions', 'id_usuario');
  }
};
