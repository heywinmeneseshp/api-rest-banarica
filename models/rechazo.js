'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rechazo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Rechazo.init({
    id_producto: DataTypes.INTEGER,
    id_motivo_de_rechazo: DataTypes.INTEGER,
    cantidad: DataTypes.INTEGER,
    serial_palet: DataTypes.STRING,
    cod_productor: DataTypes.STRING,
    id_contenedor: DataTypes.INTEGER,
    observaciones: DataTypes.TEXT,
    id_usuario: DataTypes.INTEGER,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Rechazo',
  });
  return Rechazo;
};