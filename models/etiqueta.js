'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class etiqueta extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  etiqueta.init({
    consecutivo: DataTypes.STRING,
    producto: DataTypes.STRING,
    gnl: DataTypes.STRING,
    detalle_inferior: DataTypes.STRING,
    detalle_superior: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'etiqueta',
  });
  return etiqueta;
};