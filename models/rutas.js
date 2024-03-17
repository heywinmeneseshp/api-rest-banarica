'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class rutas extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      rutas.hasMany(models.programacion, {
        foreignKey: 'ruta_id'
      });

      this.hasOne(models.ubicaciones, {
        as: 'ubicacion_1',
        foreignKey: 'id',
        sourceKey: 'ubicacion1',
      });
    
      this.hasOne(models.ubicaciones, {
        as: 'ubicacion_2',
        foreignKey: 'id',
        sourceKey: 'ubicacion2',
      });

      this.hasMany(models.galones_por_ruta, {
        foreignKey: "ruta_id",
        sourceKey: "id"
      })
    }
  }
  rutas.init({
    ubicacion1: DataTypes.STRING,
    ubicacion2: DataTypes.STRING,
    km: DataTypes.FLOAT,
    detalles: DataTypes.STRING,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'rutas',
  });
  return rutas;
};