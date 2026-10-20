'use strict';

// Bandeja de mensajes dentro de la app: un registro por usuario que recibio un
// comunicado (ademas del correo). "leido_at" queda en NULL hasta que el usuario
// abre el mensaje.
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('comunicado_destinatarios')) return;

    await queryInterface.createTable('comunicado_destinatarios', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      comunicado_id: { type: Sequelize.INTEGER, allowNull: false },
      username: { type: Sequelize.STRING, allowNull: false },
      leido_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('comunicado_destinatarios', ['username', 'leido_at'], { name: 'idx_comunicado_dest_usuario_leido' });
    await queryInterface.addIndex('comunicado_destinatarios', ['comunicado_id'], { name: 'idx_comunicado_dest_comunicado' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('comunicado_destinatarios');
  },
};
