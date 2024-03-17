'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ubicaciones extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ubicaciones.hasMany(models.rutas, {
        foreignKey: 'ubicacion1',
        as: 'ubicacion_1',
      });
    
      ubicaciones.hasMany(models.rutas, {
        foreignKey: 'ubicacion2',
        as: 'ubicacion_2',
      });
    }
  }
  ubicaciones.init({
    ubicacion: DataTypes.STRING,
    detalle: DataTypes.STRING,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ubicaciones',
  });
  return ubicaciones;
};