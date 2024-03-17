'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class galones_por_ruta extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.rutas,{
          foreignKey: 'id',
          sourceKey: "ruta_id"
        })

        this.hasOne(models.categoria_vehiculos, {
          foreignKey: 'id',
          sourceKey: "categoria_id"
        })

    }
  }
  galones_por_ruta.init({
    ruta_id: DataTypes.STRING,
    categoria_id: DataTypes.STRING,
    galones_por_ruta: DataTypes.FLOAT,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'galones_por_ruta',
  });
  return galones_por_ruta;
};