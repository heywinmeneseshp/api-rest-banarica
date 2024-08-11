'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Listado extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Listado.init({
    fecha: DataTypes.DATE,
    id_embarque: DataTypes.INTEGER,
    id_contenedor: DataTypes.INTEGER,
    id_lugar_de_llenado: DataTypes.INTEGER,
    id_producto: DataTypes.INTEGER,
    cajas_unidades: DataTypes.INTEGER,
    id_sae: DataTypes.INTEGER,
    transbordado: DataTypes.BOOLEAN,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Listado',
  });
  return Listado;
};