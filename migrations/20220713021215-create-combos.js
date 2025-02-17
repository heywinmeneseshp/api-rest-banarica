'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('combos', {
      id: {
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      consecutivo: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      nombre: {
        type: Sequelize.STRING,
        unique: true,
      },
      isBlock: {
        type: Sequelize.BOOLEAN
      },
      id_cliente: {
        type: Sequelize.INTEGER,
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      cajas_por_palet: {
        type: Sequelize.INTEGER,
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      cajas_por_mini_palet: {
        type: Sequelize.INTEGER,
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      palets_por_contenedor: {
        type: Sequelize.INTEGER,
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      peso_neto: {
        type: Sequelize.FLOAT, // O DECIMAL si necesitas precisión
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      peso_bruto: {
        type: Sequelize.FLOAT, // O DECIMAL si necesitas precisión
        allowNull: true // Cambiar a false si la columna no puede ser nula
      },
      precio_de_venta: {
        type: Sequelize.FLOAT, // O DECIMAL si necesitas precisión
        allowNull: true // Cambiar a false si la columna no puede ser nula
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
    await queryInterface.dropTable('combos');
  }
};
