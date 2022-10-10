'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class serial_de_articulos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  serial_de_articulos.init({
    cons_producto: DataTypes.STRING,
    serial: DataTypes.STRING,
    bag_pack: DataTypes.STRING,
    s_pack: DataTypes.STRING,
    m_pack: DataTypes.STRING,
    l_pack: DataTypes.STRING,
    cons_almacen: DataTypes.STRING,
    available: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'serial_de_articulos',
  });
  return serial_de_articulos;
};