'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transbordo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Transbordo.init({
    id_contenedor_viejo: DataTypes.INTEGER,
    id_contenedor_nuevo: DataTypes.INTEGER,
    fecha_transbordo: DataTypes.DATE,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Transbordo',
  });
  return Transbordo;
};