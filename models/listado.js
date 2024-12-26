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
      this.hasOne(models.Contenedor, {
        sourceKey: 'id_contenedor',
        foreignKey: 'id'
      })
      this.hasOne(models.Embarque, {
        sourceKey: 'id_embarque',
        foreignKey: 'id'
      })
      this.hasOne(models.almacenes, {
        as: 'almacen',
        sourceKey: 'id_lugar_de_llenado',
        foreignKey: 'id'
      })
      this.hasOne(models.combos, {
        sourceKey: 'id_producto',
        foreignKey: 'id'
      })
      this.hasMany(models.serial_de_articulos, {
        sourceKey: 'id_contenedor',
        foreignKey: 'id_contenedor'
      })
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