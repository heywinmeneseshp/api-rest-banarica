'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Destino extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Destino.init({
    destino: DataTypes.STRING,
    pais: DataTypes.STRING,
    cod: DataTypes.STRING,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Destino',
  });
  return Destino;
};