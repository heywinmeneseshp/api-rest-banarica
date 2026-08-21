'use strict';

// Esta tabla ya existia en la base de datos de produccion (creada a mano,
// nunca quedo una migracion de creacion), por eso una base de datos nueva
// (dev, restauracion, etc.) fallaba con "Table 'programacion_corte' doesn't
// exist" aunque el resto de migraciones sí corrieran. up() no hace nada si la
// tabla ya existe, para no romper produccion al correr esta migracion ahi.
module.exports = {
  async up(queryInterface, Sequelize) {
    const tablas = await queryInterface.showAllTables();
    const yaExiste = tablas.some((t) => String(t).toLowerCase() === 'programacion_corte');
    if (yaExiste) return;

    await queryInterface.createTable('programacion_corte', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      fecha: {
        type: Sequelize.STRING,
      },
      booking: {
        type: Sequelize.STRING,
      },
      proceso_empaque: {
        type: Sequelize.STRING,
      },
      finca: {
        type: Sequelize.STRING,
      },
      cajas: {
        type: Sequelize.INTEGER,
      },
      id_embarque: {
        type: Sequelize.INTEGER,
      },
      id_almacen: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('programacion_corte');
  },
};
