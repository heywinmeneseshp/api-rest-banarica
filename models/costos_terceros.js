'use strict';
// Modulo Costos logisticos (cobros a terceros). Tabla creada en migrations/20261110000000-create-costos-pendiente-por-cobrar.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_terceros', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tipo: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'otro' },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  nit: { type: DataTypes.STRING(40), allowNull: true },
}, { tableName: 'costos_terceros', freezeTableName: true });
