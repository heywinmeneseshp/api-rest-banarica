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
        type: Sequelize.STRING,
        references: {
          model: 'productos',
          key: 'consecutivo'
        }
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
      cons_movimiento: {
        type: Sequelize.STRING,
      },
      available: {
        type: Sequelize.BOOLEAN
      },
      id_contenedor: {
        type: Sequelize.INTEGER,
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      fecha_de_uso: {
        type: Sequelize.DATE,
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      id_motivo_de_uso: {
        type: Sequelize.INTEGER,
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      ubicacion_en_contenedor: {
       type: Sequelize.STRING,
       allowNull: true
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
