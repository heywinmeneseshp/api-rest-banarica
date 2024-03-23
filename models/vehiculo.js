'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class vehiculo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.programacion, {
        foreignKey: 'vehiculo_id',
      });

      this.hasMany(models.galones_por_ruta, {
        foreignKey: "categoria_id",
        sourceKey: "id"
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