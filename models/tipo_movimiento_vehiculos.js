'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tipo_movimiento_vehiculos extends Model {
    static associate() {}
  }

  tipo_movimiento_vehiculos.init({
    movimiento: DataTypes.STRING,
    requiere_contenedor: DataTypes.BOOLEAN,
    activo: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'tipo_movimiento_vehiculos',
    tableName: 'tipo_movimiento_vehiculos',
  });

  return tipo_movimiento_vehiculos;
};
