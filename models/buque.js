'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Buque extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Buque.init({
    buque: DataTypes.STRING,
    id_naviera: DataTypes.INTEGER,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Buque',
  });
  return Buque;
};