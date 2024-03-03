'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class categoria_vehiculos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  categoria_vehiculos.init({
    categoria: DataTypes.STRING,
    galones_por_kilometro: DataTypes.FLOAT,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'categoria_vehiculos',
  });
  return categoria_vehiculos;
};