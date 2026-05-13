'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transportadoras extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.carrusel, {
        sourceKey: "id",
        foreignKey: "id_transportadora",
        as: "carrusel"
      })
    }
  }
  transportadoras.init({
    consecutivo: DataTypes.STRING,
    razon_social: DataTypes.STRING,
    direccion: DataTypes.STRING,
    tel: DataTypes.STRING,
    email: DataTypes.STRING,
    isBlock: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'transportadoras',
  });
  return transportadoras;
};