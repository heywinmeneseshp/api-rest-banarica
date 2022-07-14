'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class historial_movimientos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  historial_movimientos.init({
    cons_movimiento: DataTypes.STRING,
    cons_producto: DataTypes.STRING,
    cons_almacen_gestor: DataTypes.STRING,
    cons_almacen_receptor: DataTypes.STRING,
    cons_lista_movimientos: DataTypes.STRING,
    tipo_movimiento: DataTypes.STRING,
    razon_movimiento: DataTypes.STRING,
    cantidad: DataTypes.FLOAT,
    cons_pedido: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'historial_movimientos',
  });
  return historial_movimientos;
};