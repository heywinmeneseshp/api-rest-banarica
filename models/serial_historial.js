'use strict';
// Historial de sobrescritura de seriales (Recepcion). Tabla creada en migrations/20261120000000-create-serial-historial.js
module.exports = (sequelize, DataTypes) => sequelize.define('serial_historial', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_serial: { type: DataTypes.INTEGER, allowNull: false },
  serial: { type: DataTypes.STRING(150), allowNull: false },
  campo: { type: DataTypes.STRING(40), allowNull: false },
  valor_anterior: { type: DataTypes.STRING(255), allowNull: true },
  valor_nuevo: { type: DataTypes.STRING(255), allowNull: true },
  usado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  motivo: { type: DataTypes.STRING(255), allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  cons_movimiento: { type: DataTypes.STRING(40), allowNull: true },
  usuario: { type: DataTypes.STRING(80), allowNull: true },
  revertido: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'serial_historials' });
