'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('serial_de_articulos', 'id_listado', {
      type: Sequelize.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });

    await queryInterface.addColumn('serial_de_articulos', 'fecha_de_uso', {
      type: Sequelize.DATE,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });

    await queryInterface.addColumn('serial_de_articulos', 'id_motivo_de_uso', {
      type: Sequelize.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });

    await queryInterface.addColumn('serial_de_articulos', 'id_usuario', {
      type: Sequelize.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('serial_de_articulos', 'id_listado');
    await queryInterface.removeColumn('serial_de_articulos', 'fecha_de_uso');
    await queryInterface.removeColumn('serial_de_articulos', 'id_motivo_de_uso');
    await queryInterface.removeColumn('serial_de_articulos', 'id_usuario');
  }
};
