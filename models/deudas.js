'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class deudas extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  deudas.init({
    consecutivo: DataTypes.STRING,
    prestador: DataTypes.STRING,
    deudor: DataTypes.STRING,
    cons_producto: DataTypes.STRING,
    cantidad: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'deudas',
  });
  return deudas;
};