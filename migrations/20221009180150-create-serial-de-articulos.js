'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('serial_de_articulos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cons_producto: {
        type: Sequelize.STRING
      },
      serial: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      bag_pack: {
        type: Sequelize.STRING
      },
      s_pack: {
        type: Sequelize.STRING
      },
      m_pack: {
        type: Sequelize.STRING
      },
      l_pack: {
        type: Sequelize.STRING
      },
      cons_almacen: {
        type: Sequelize.STRING
      },
      available: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('serial_de_articulos');
  }
};
