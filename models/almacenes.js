'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class almacenes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  almacenes.init({
    consecutivo: DataTypes.STRING,
    nombre: DataTypes.STRING,
    razon_social: DataTypes.STRING,
    direccion: DataTypes.STRING,
    telefono: DataTypes.STRING,
    email: DataTypes.STRING,
    isBlock: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'almacenes',
  });
  return almacenes;
};