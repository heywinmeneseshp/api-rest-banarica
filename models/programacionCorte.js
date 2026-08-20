'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class programacionCorte extends Model {
    static associate(models) {
      programacionCorte.hasOne(models.Embarque, {
        foreignKey: 'id',
        sourceKey: 'id_embarque',
        as: 'Embarque'
      });
      programacionCorte.hasOne(models.almacenes, {
        foreignKey: 'id',
        sourceKey: 'id_almacen',
        as: 'almacen'
      });
      programacionCorte.hasOne(models.combos, {
        foreignKey: 'id',
        sourceKey: 'id_combo',
        as: 'combo'
      });
    }
  }

  programacionCorte.init({
    fecha: DataTypes.STRING,
    booking: DataTypes.STRING,
    proceso_empaque: DataTypes.STRING,
    finca: DataTypes.STRING,
    cajas: DataTypes.INTEGER,
    id_embarque: DataTypes.INTEGER,
    id_almacen: DataTypes.INTEGER,
    id_combo: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'programacionCorte',
    tableName: 'programacion_corte'
  });

  return programacionCorte;
};