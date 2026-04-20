'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [legacyConfigs] = await queryInterface.sequelize.query(
        "SELECT id FROM configuracions WHERE modulo = 'Email'",
        { transaction }
      );

      const [newConfigs] = await queryInterface.sequelize.query(
        "SELECT id FROM configuracions WHERE modulo = 'email_envio'",
        { transaction }
      );

      if (legacyConfigs.length > 0 && newConfigs.length === 0) {
        await queryInterface.bulkUpdate(
          'configuracions',
          { modulo: 'email_envio', updatedAt: new Date() },
          { modulo: 'Email' },
          { transaction }
        );
      }

      if (legacyConfigs.length > 0 && newConfigs.length > 0) {
        await queryInterface.bulkDelete(
          'configuracions',
          { modulo: 'Email' },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkUpdate(
        'configuracions',
        { modulo: 'Email', updatedAt: new Date() },
        { modulo: 'email_envio' },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
