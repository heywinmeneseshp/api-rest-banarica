'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class movimientos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.historial_movimientos, {
        as: 'historial_movimientos',
        foreignKey: 'cons_movimiento',
        sourceKey: 'consecutivo'
      });
      this.hasOne(models.usuarios, {
        as: 'realizado',
        foreignKey: 'username',
        sourceKey: 'realizado_por'
      });
      this.hasOne(models.usuarios, {
        as: 'aprobado',
        foreignKey: 'username',
        sourceKey: 'aprobado_por'
      });
      // define association here
    }
  }
  movimientos.init({
    consecutivo: DataTypes.STRING,
    remision: DataTypes.STRING,
    pendiente: DataTypes.BOOLEAN,
    observaciones: DataTypes.STRING,
    respuesta: DataTypes.STRING,
    cons_semana: DataTypes.STRING,
    realizado_por: DataTypes.STRING,
    aprobado_por: DataTypes.STRING,
    vehiculo: DataTypes.STRING,
    fecha: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'movimientos',
  });
  return movimientos;
};
