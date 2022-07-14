'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tabla_pedidos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  tabla_pedidos.init({
    consecutivo: DataTypes.STRING,
    pendiente: DataTypes.BOOLEAN,
    observaciones: DataTypes.STRING,
    fecha: DataTypes.STRING,
    cons_semana: DataTypes.STRING,
    usuario: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'tabla_pedidos',
  });
  return tabla_pedidos;
};