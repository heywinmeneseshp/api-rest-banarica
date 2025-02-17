'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Naviera extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Naviera.init({
    navieras: {
      type: DataTypes.STRING,
      unique: true, // Restricción de unicidad
    },
    cod: {
      type: DataTypes.STRING,
      unique: true, // Restricción de unicidad
    },
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Naviera',
  });
  return Naviera;
};