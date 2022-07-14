'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class movimientos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  movimientos.init({
    consecutivo: DataTypes.STRING,
    pendiente: DataTypes.BOOLEAN,
    observaciones: DataTypes.STRING,
    cons_semana: DataTypes.STRING,
    fecha: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'movimientos',
  });
  return movimientos;
};