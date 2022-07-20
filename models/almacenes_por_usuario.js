'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class almacenes_por_usuario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  almacenes_por_usuario.init({
    id_almacen: DataTypes.STRING,
    username: DataTypes.STRING,
    habilitado: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'almacenes_por_usuario',
  });
  return almacenes_por_usuario;
};