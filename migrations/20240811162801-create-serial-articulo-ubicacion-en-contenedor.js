'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('serial_de_articulos', 'ubicacion_en_contenedor', {
      type: Sequelize.STRING,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    });


  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('serial_de_articulos', 'ubicacion_en_contenedor');
  }
};
