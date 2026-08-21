'use strict';

// Igual que programacion_corte: esta tabla existia en produccion creada a
// mano, sin migracion de creacion, asi que una base de datos nueva fallaba
// con "Table 'serialArticuloPorContenedors' doesn't exist". up() no hace
// nada si la tabla ya existe, para no romper produccion al correr esto ahi.
module.exports = {
  async up(queryInterface, Sequelize) {
    const tablas = await queryInterface.showAllTables();
    const yaExiste = tablas.some((t) => String(t).toLowerCase() === 'serialarticuloporcontenedors');
    if (yaExiste) return;

    await queryInterface.createTable('serialArticuloPorContenedors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      id_serial_articulo: {
        type: Sequelize.STRING,
      },
      ubicacion: {
        type: Sequelize.STRING,
      },
      id_contenedor: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('serialArticuloPorContenedors');
  },
};
