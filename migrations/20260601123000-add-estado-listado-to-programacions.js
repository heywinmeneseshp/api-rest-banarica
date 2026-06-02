'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('programacions');

    if (!table.estado_listado) {
      await queryInterface.addColumn('programacions', 'estado_listado', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendiente',
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE programacions
      SET estado_listado = 'pendiente'
      WHERE estado_listado IS NULL OR estado_listado = ''
    `);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('programacions');

    if (table.estado_listado) {
      await queryInterface.removeColumn('programacions', 'estado_listado');
    }
  }
};
