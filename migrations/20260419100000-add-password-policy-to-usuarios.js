'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'password_changed_at', {
      allowNull: true,
      type: Sequelize.DATE
    });

    await queryInterface.addColumn('usuarios', 'password_reminder_sent_at', {
      allowNull: true,
      type: Sequelize.DATE
    });

    await queryInterface.addColumn('usuarios', 'password_blocked_at', {
      allowNull: true,
      type: Sequelize.DATE
    });

    await queryInterface.sequelize.query(`
      UPDATE usuarios
      SET password_changed_at = COALESCE(password_changed_at, updatedAt, createdAt)
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('usuarios', 'password_blocked_at');
    await queryInterface.removeColumn('usuarios', 'password_reminder_sent_at');
    await queryInterface.removeColumn('usuarios', 'password_changed_at');
  }
};
