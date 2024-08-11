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
    navieras: DataTypes.STRING,
    cod: DataTypes.STRING,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Naviera',
  });
  return Naviera;
};