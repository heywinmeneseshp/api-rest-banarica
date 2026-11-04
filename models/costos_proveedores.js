'use strict';
// Modulo Costos logisticos. Tabla creada en migrations/20261103000000-create-costos-logisticos.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_proveedores', {
  nit: { type: DataTypes.STRING(40), primaryKey: true, allowNull: false },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  razon_social: { type: DataTypes.STRING(250), allowNull: true },
}, { tableName: 'costos_proveedores', freezeTableName: true });
