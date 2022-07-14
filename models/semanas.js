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
    static associate(models) {
      // define association here
    }
  }
  semanas.init({
    consecutivo: DataTypes.STRING,
    semana: DataTypes.STRING,
    anho: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'semanas',
  });
  return semanas;
};