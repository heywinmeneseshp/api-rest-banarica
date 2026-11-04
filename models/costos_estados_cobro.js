'use strict';
// Modulo Costos logisticos (cobros a terceros). Tabla creada en migrations/20261110000000-create-costos-pendiente-por-cobrar.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_estados_cobro', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  color: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '#6c757d' },
  descripcion: { type: DataTypes.STRING(300), allowNull: true },
}, { tableName: 'costos_estados_cobro', freezeTableName: true });
