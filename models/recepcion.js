'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class recepcion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  recepcion.init({
    consecutivo: DataTypes.STRING,
    remision: DataTypes.STRING,
    observaciones: DataTypes.STRING,
    cons_semana: DataTypes.STRING,
    fecha: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'recepcion',
  });
  return recepcion;
};