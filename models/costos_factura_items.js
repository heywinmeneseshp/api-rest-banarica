'use strict';
// Modulo Costos logisticos. Tabla creada en migrations/20261103000000-create-costos-logisticos.js
module.exports = (sequelize, DataTypes) => sequelize.define('costos_factura_items', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  factura_id: { type: DataTypes.INTEGER, allowNull: false },
  semana: { type: DataTypes.STRING(40), allowNull: true },
  mes: { type: DataTypes.STRING(40), allowNull: true },
  anho: { type: DataTypes.STRING(10), allowNull: true },
  concepto: { type: DataTypes.STRING(300), allowNull: true },
  id_contenedor: { type: DataTypes.STRING(40), allowNull: true },
  booking: { type: DataTypes.STRING(60), allowNull: true },
  divisa: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'COP' },
  cantidad: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
  valor_unitario: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
  nivel_asociacion: { type: DataTypes.STRING(40), allowNull: true },
  tipo_costo: { type: DataTypes.STRING(40), allowNull: true },
  metodo_distribucion: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'por_cajas' },
  distribuido_en: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'costos_factura_items', freezeTableName: true });
