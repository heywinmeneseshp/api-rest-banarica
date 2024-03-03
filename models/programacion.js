'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class programacion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  programacion.init({
    itininerario_id: DataTypes.STRING,
    ruta_id: DataTypes.STRING,
    producto_id: DataTypes.STRING,
    cantidad: DataTypes.FLOAT,
    detalles: DataTypes.STRING,
    cobrar: DataTypes.BOOLEAN,
    id_pagador_flete: DataTypes.STRING,
    unidad_medida: DataTypes.STRING,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'programacion',
  });
  return programacion;
};