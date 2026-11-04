'use strict';
// Modulo Costos logisticos. Tabla creada en migrations/20261103000000-create-costos-logisticos.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_items_catalog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  codigo: { type: DataTypes.STRING(60), allowNull: true },
  nombre: { type: DataTypes.STRING(250), allowNull: false },
  descripcion: { type: DataTypes.STRING(400), allowNull: true },
  unidad: { type: DataTypes.STRING(40), allowNull: true },
  precio_ref: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
  tipo_costo_default: { type: DataTypes.STRING(40), allowNull: true },
}, { tableName: 'costos_items_catalog', freezeTableName: true });
