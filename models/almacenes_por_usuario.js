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
      this.hasOne(models.almacenes, {
        as: 'almacen',
        foreignKey: 'consecutivo',
        sourceKey: 'id_almacen'
      })
    }
  }
  almacenes_por_usuario.init({
    id_almacen: DataTypes.STRING,
    username: DataTypes.STRING,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'almacenes_por_usuario',
  });
  return almacenes_por_usuario;
};
