'use strict';
// Modulo Costos logisticos. Tabla creada en migrations/20261103000000-create-costos-logisticos.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_facturas', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fecha: { type: DataTypes.STRING(10), allowNull: true },
  tipo: { type: DataTypes.STRING(120), allowNull: true },
  numero_factura: { type: DataTypes.STRING(80), allowNull: true },
  nit_proveedor: { type: DataTypes.STRING(40), allowNull: true },
  total: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
  estado_total: { type: DataTypes.STRING(20), allowNull: true },
  estado: { type: DataTypes.STRING(120), allowNull: true },
}, { tableName: 'costos_facturas', freezeTableName: true });
