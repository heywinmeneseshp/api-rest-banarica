'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class serialArticuloPorContenedor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  serialArticuloPorContenedor.init({
    id_serial_articulo: DataTypes.STRING,
    ubicacion: DataTypes.STRING,
    id_contenedor: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'serialArticuloPorContenedor',
  });
  return serialArticuloPorContenedor;
};