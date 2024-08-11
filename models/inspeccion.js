'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Inspeccion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Inspeccion.init({
    id_contenedor: DataTypes.INTEGER,
    fecha_inspeccion: DataTypes.DATE,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Inspeccion',
  });
  return Inspeccion;
};