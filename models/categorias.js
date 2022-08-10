'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class categorias extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  categorias.init({
    consecutivo: DataTypes.STRING,
    nombre: DataTypes.STRING,
    isBlock: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'categorias',
  });
  return categorias;
};
