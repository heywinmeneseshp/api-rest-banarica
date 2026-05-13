'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class carrusel extends Model {
    static associate(models) {
      this.belongsTo(models.transportadoras, {
        foreignKey: 'id_transportadora',
        as: 'transportadora'
      });
      this.belongsTo(models.Contenedor, {
        foreignKey: 'id_contenedor',
        as: 'contenedor'
      });
    }
  }
  carrusel.init({
    id_transportadora: DataTypes.INTEGER,
    id_contenedor: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'carrusel',
  });
  return carrusel;
};