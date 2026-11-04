'use strict';
// Modulo Costos logisticos (cobros a terceros). Tabla creada en migrations/20261110000000-create-costos-pendiente-por-cobrar.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_cobros', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  item_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  tercero_id: { type: DataTypes.INTEGER, allowNull: false },
  motivo: { type: DataTypes.STRING(500), allowNull: true },
  estado: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'Pendiente por cobrar' },
  fecha_cobro: { type: DataTypes.STRING(10), allowNull: true },
  fecha_pago: { type: DataTypes.STRING(10), allowNull: true },
}, { tableName: 'costos_cobros', freezeTableName: true });
