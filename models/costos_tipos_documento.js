'use strict';
// Modulo Costos logisticos. Tabla creada en migrations/20261103000000-create-costos-logisticos.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_tipos_documento', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  sentido: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'resta' },
  descripcion: { type: DataTypes.STRING(300), allowNull: true },
}, { tableName: 'costos_tipos_documento', freezeTableName: true });
