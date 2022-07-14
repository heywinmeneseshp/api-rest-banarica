'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class pedidos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  pedidos.init({
    cons_pedido: DataTypes.STRING,
    cons_producto: DataTypes.STRING,
    cons_almacen_destino: DataTypes.STRING,
    cantidad: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'pedidos',
  });
  return pedidos;
};