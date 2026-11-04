'use strict';
// Modulo Costos logisticos. Tabla creada en migrations/20261103000000-create-costos-logisticos.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_tipos_costo', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  codigo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  descripcion: { type: DataTypes.STRING(300), allowNull: true },
  aplica_finca: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  aplica_puerto: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  aplica_inspeccion: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  aplica_todos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'costos_tipos_costo', freezeTableName: true });
