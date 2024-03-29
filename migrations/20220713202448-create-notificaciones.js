'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notificaciones', {
      id: {
        unique: true,
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      almacen_emisor: {
        type: Sequelize.STRING
      },
      almacen_receptor: {
        type: Sequelize.STRING
      },
      cons_movimiento: {
        type: Sequelize.STRING
      },
      tipo_movimiento: {
        type: Sequelize.STRING
      },
      descripcion: {
        type: Sequelize.STRING
      },
      dif_porcentual_consumo: {
        type: Sequelize.FLOAT
      },
      id_vehiculo: {
        type: Sequelize.STRING
      },
      aprobado: {
        type: Sequelize.BOOLEAN
      },
      visto: {
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
    await queryInterface.dropTable('notificaciones');
  }
};
