'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class notificaciones extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  notificaciones.init({
    consecutivo: DataTypes.STRING,
    cons_almacen: DataTypes.STRING,
    cons_movimiento: DataTypes.STRING,
    aprobado: DataTypes.BOOLEAN,
    visto: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'notificaciones',
  });
  return notificaciones;
};