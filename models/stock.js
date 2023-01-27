'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class stock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.productos, {
        as: 'producto',
        foreignKey: 'consecutivo',
        sourceKey: 'cons_producto'
      })
      this.hasOne(models.almacenes, {
        as: 'almacen',
        foreignKey: 'consecutivo',
        sourceKey: 'cons_almacen'
      })
      // define association here
    }
  }
  stock.init({
    cons_almacen: DataTypes.STRING,
    cons_producto: DataTypes.STRING,
    cantidad: DataTypes.FLOAT,
    no_disponible: DataTypes.FLOAT,
    aviso: DataTypes.FLOAT,
    isBlock: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'stock',
  });
  return stock;
};
