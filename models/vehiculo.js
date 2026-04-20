'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class vehiculo extends Model {
    static associate(models) {
      this.hasMany(models.programacion, {
        foreignKey: 'vehiculo_id',
      });

      this.hasMany(models.galones_por_ruta, {
        foreignKey: "categoria_id",
        sourceKey: "id"
      });

      this.hasMany(models.notificaciones, {
        foreignKey: 'id_vehiculo',
        sourceKey: "id"
      });

      this.hasMany(models.tanqueos, {
        foreignKey: 'vehiculo_id',
        sourceKey: 'id'
      });
    }
  }
  vehiculo.init({
    vehiculo: DataTypes.STRING,
    modelo: DataTypes.STRING,
    placa: DataTypes.STRING,
    conductor_id: DataTypes.STRING,
    categoria_id: DataTypes.STRING,
    combustible: DataTypes.FLOAT,
    gal_por_km: DataTypes.FLOAT,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'vehiculo',
  });
  return vehiculo;
};
