'use strict';
// Modulo Costos logisticos. Tabla creada en migrations/20261103000000-create-costos-logisticos.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_trm', {
  fecha: { type: DataTypes.STRING(10), primaryKey: true, allowNull: false },
  valor: { type: DataTypes.DECIMAL(14, 4), allowNull: false },
}, { tableName: 'costos_trm', freezeTableName: true });
