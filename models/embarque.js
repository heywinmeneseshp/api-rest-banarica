'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Embarque extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Embarque.init({
    id_semana: DataTypes.INTEGER,
    id_cliente: DataTypes.INTEGER,
    id_destino: DataTypes.INTEGER,
    id_naviera: DataTypes.INTEGER,
    viaje: DataTypes.STRING,
    id_buque: DataTypes.INTEGER,
    booking: DataTypes.STRING,
    bl: DataTypes.STRING,
    fecha_zarpe: DataTypes.DATE,
    fecha_arribo: DataTypes.DATE,
    observaciones: DataTypes.TEXT,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Embarque',
  });
  return Embarque;
};