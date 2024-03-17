'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tanqueos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  tanqueos.init({
    fecha: DataTypes.DATE,
    factura: DataTypes.STRING,
    tanqueo: DataTypes.FLOAT,
    costo: DataTypes.FLOAT,
    record_consumo_id: DataTypes.STRING,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'tanqueos',
  });
  return tanqueos;
};