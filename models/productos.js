'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class productos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  productos.init({
    consecutivo: DataTypes.STRING,
    name: DataTypes.STRING,
    cons_categoria: DataTypes.STRING,
    cons_proveedor: DataTypes.STRING,
    salida_sin_stock: DataTypes.STRING,
    serial: DataTypes.BOOLEAN,
    permitir_traslados: DataTypes.BOOLEAN,
    costo: DataTypes.FLOAT,
    isBlock: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'productos',
  });
  return productos;
};