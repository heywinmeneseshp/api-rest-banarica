'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class consumo_ruta_vehiculo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.vehiculo, {
        foreignKey: 'id',
        sourceKey: 'vehiculo_id'
      });

      this.hasOne(models.rutas, {
        foreignKey: 'id',
        sourceKey: 'ruta_id'
      });
    }
  }
  consumo_ruta_vehiculo.init({
    vehiculo_id: DataTypes.STRING,
    ruta_id: DataTypes.STRING,
    consumo_por_km: DataTypes.FLOAT,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'consumo_ruta_vehiculo',
    tableName: 'consumo_ruta_vehiculo'
  });
  return consumo_ruta_vehiculo;
};