'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehiculos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      vehiculo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      modelo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      placa: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      conductor_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      categoria_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      combustible: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      gal_por_km: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Agregar índices para mejorar el rendimiento
    await queryInterface.addIndex('vehiculos', ['placa'], {
      unique: true,
      name: 'idx_vehiculos_placa'
    });

    await queryInterface.addIndex('vehiculos', ['conductor_id'], {
      name: 'idx_vehiculos_conductor'
    });

    await queryInterface.addIndex('vehiculos', ['categoria_id'], {
      name: 'idx_vehiculos_categoria'
    });

    await queryInterface.addIndex('vehiculos', ['activo'], {
      name: 'idx_vehiculos_activo'
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar índices primero
    await queryInterface.removeIndex('vehiculos', 'idx_vehiculos_placa');
    await queryInterface.removeIndex('vehiculos', 'idx_vehiculos_conductor');
    await queryInterface.removeIndex('vehiculos', 'idx_vehiculos_categoria');
    await queryInterface.removeIndex('vehiculos', 'idx_vehiculos_activo');
    
    // Eliminar la tabla
    await queryInterface.dropTable('vehiculos');
  }
};