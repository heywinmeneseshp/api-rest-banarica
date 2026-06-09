'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('programacion_seriales', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      programacion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'programacions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      serial_articulo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'serial_de_articulos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      id_contenedor: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Contenedors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fecha_uso: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      semana: {
        type: Sequelize.STRING,
        allowNull: true
      },
      id_motivo_de_uso: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'MotivoDeUsos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    await queryInterface.addIndex('programacion_seriales', ['programacion_id']);
    await queryInterface.addIndex('programacion_seriales', ['serial_articulo_id']);
    await queryInterface.addIndex('programacion_seriales', ['id_contenedor']);
    await queryInterface.addIndex('programacion_seriales', ['programacion_id', 'serial_articulo_id'], {
      unique: true,
      name: 'programacion_seriales_programacion_serial_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('programacion_seriales');
  }
};
