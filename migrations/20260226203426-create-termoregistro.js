'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Termoregistros', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      termografoId: {
        type: Sequelize.INTEGER
      },
      temperatura: {
        type: Sequelize.FLOAT
      },
      fechaHora: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Termoregistros');
  }
};