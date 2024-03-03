'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class rutas extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  rutas.init({
    ubicacion1: DataTypes.STRING,
    ubicacion1: DataTypes.STRING,
    km: DataTypes.FLOAT,
    detalles: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'rutas',
  });
  return rutas;
};