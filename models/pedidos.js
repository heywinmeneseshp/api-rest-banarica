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
      this.hasOne(models.tabla_pedidos, {
        foreignKey: "consecutivo",
        sourceKey:"cons_pedido",
        as: "tabla"
      })
      this.hasOne(models.productos, {
        foreignKey: "consecutivo",
        sourceKey: "cons_producto",
        as: "producto"
      })
      this.hasOne(models.almacenes, {
        foreignKey: "consecutivo",
        sourceKey: "cons_almacen_destino",
        as: "almacen"
      })

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
