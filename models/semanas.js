'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class semanas extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  semanas.init({
    consecutivo: DataTypes.STRING,
    semana: DataTypes.STRING,
    anho: DataTypes.STRING,
    fecha_inicio: DataTypes.DATEONLY,
    fecha_fin: DataTypes.DATEONLY,
    dias_semana: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'semanas',
  });
  return semanas;
};
