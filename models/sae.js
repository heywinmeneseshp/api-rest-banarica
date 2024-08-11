'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SAE extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SAE.init({
    sae: DataTypes.STRING,
    condicion_ubicacion: DataTypes.INTEGER,
    condicion_combo: DataTypes.INTEGER,
    id_embarque: DataTypes.INTEGER,
    anuncio: DataTypes.STRING,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'SAE',
  });
  return SAE;
};