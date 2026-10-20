'use strict';

// Historial de comunicados (correos manuales a roles, usuarios o correos
// sueltos) enviados desde Maestros > Comunicados. Es un log inmutable: no se
// edita ni se borra. El contenido binario de los adjuntos nunca se guarda,
// solo su metadata.
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('comunicados')) return;

    await queryInterface.createTable('comunicados', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      asunto: { type: Sequelize.STRING(200), allowNull: false },
      mensaje: { type: Sequelize.TEXT, allowNull: false },
      destinatarios_resumen: { type: Sequelize.JSON, allowNull: true },
      resultados: { type: Sequelize.JSON, allowNull: true },
      adjuntos: { type: Sequelize.JSON, allowNull: true },
      total_destinatarios: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      enviados_ok: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      enviados_error: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_by: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('comunicados');
  },
};
