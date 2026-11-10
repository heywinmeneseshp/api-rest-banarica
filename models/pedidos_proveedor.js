'use strict';
// Pedidos a proveedor (cobertura de stock). Tabla creada en migrations/20261115000000-create-pedidos-proveedor.js
module.exports = (sequelize, DataTypes) => sequelize.define('pedidos_proveedor', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  codigo: { type: DataTypes.STRING(20), allowNull: true, unique: true },
  cons_proveedor: { type: DataTypes.STRING(40), allowNull: true },
  proveedor: { type: DataTypes.STRING(250), allowNull: true },
  usuario: { type: DataTypes.STRING(80), allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  detalle: { type: DataTypes.TEXT, allowNull: true },
  destinatarios: { type: DataTypes.STRING(500), allowNull: true },
  enviado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  almacenes: { type: DataTypes.STRING(200), allowNull: true },
  recibido: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  fecha_recibido: { type: DataTypes.STRING(10), allowNull: true },
  recibido_por: { type: DataTypes.STRING(80), allowNull: true },
}, { tableName: 'pedidos_proveedor', freezeTableName: true });
