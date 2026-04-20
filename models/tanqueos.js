'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tanqueos extends Model {
    static associate(models) {
      this.belongsTo(models.vehiculo, {
        foreignKey: 'vehiculo_id',
        targetKey: 'id'
      });

      this.belongsTo(models.record_consumos, {
        foreignKey: 'record_consumo_id',
        targetKey: 'id'
      });
    }
  }
  tanqueos.init({
    fecha: DataTypes.DATE,
    factura: DataTypes.STRING,
    tanqueo: DataTypes.FLOAT,
    costo: DataTypes.FLOAT,
    record_consumo_id: DataTypes.STRING,
    vehiculo_id: DataTypes.STRING,
    saldo_anterior: DataTypes.FLOAT,
    saldo_nuevo: DataTypes.FLOAT,
    observacion: DataTypes.STRING,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'tanqueos',
  });
  return tanqueos;
};
