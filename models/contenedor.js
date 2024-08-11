'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Contenedor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Contenedor.init({
    contenedor: DataTypes.STRING,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Contenedor',
  });
  return Contenedor;
};