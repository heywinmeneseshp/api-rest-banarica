'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Contenedor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Listado, {
        sourceKey: "id",
        foreignKey: "id_contenedor"
      })
      this.hasOne(models.carrusel, {
        sourceKey: "id",
        foreignKey: "id_contenedor"
      })
    }
  }
  Contenedor.init({
    contenedor: DataTypes.STRING,
    habilitado: DataTypes.BOOLEAN,
    hora_revision_puerto: DataTypes.DATE,
    latitud_revision_puerto: DataTypes.DECIMAL(10, 7),
    longitud_revision_puerto: DataTypes.DECIMAL(10, 7),
  }, {
    sequelize,
    modelName: 'Contenedor',
  });
  return Contenedor;
};