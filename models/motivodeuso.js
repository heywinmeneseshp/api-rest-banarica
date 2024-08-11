'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MotivoDeUso extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MotivoDeUso.init({
    motivo_de_uso: DataTypes.STRING,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'MotivoDeUso',
  });
  return MotivoDeUso;
};