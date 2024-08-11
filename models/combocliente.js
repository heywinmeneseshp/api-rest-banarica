'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ComboCliente extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ComboCliente.init({
    id_cliente: DataTypes.INTEGER,
    id_combos: DataTypes.INTEGER,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ComboCliente',
  });
  return ComboCliente;
};