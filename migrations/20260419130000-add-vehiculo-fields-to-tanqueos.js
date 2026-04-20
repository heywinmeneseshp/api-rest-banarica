'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tanqueos', 'vehiculo_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('tanqueos', 'saldo_anterior', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('tanqueos', 'saldo_nuevo', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('tanqueos', 'observacion', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tanqueos', 'observacion');
    await queryInterface.removeColumn('tanqueos', 'saldo_nuevo');
    await queryInterface.removeColumn('tanqueos', 'saldo_anterior');
    await queryInterface.removeColumn('tanqueos', 'vehiculo_id');
  }
};
