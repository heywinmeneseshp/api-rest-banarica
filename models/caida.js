'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Caida extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The models/index file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Caida.init({
    id_contenedor: DataTypes.INTEGER,
    id_producto: DataTypes.INTEGER,
    cod_almacen: DataTypes.STRING,
    cantidad: DataTypes.INTEGER,
    id_motivo: DataTypes.INTEGER,
    fecha: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Caida',
  });
  return Caida;
};