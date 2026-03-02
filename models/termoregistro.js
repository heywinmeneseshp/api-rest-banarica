'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Termoregistro extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Termoregistro.init({
    termografoId: DataTypes.INTEGER,
    temperatura: DataTypes.FLOAT,
    fechaHora: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Termoregistro',
  });
  return Termoregistro;
};