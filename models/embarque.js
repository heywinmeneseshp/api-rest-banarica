'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Embarque extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.Destino, {
        foreignKey: 'id',
        sourceKey: 'id_destino'
      });
      this.hasOne(models.Naviera, {
        foreignKey: 'id',
        sourceKey: 'id_naviera'
      });
      this.hasOne(models.clientes, {
        foreignKey: 'id',
        sourceKey: 'id_cliente'
      });
      this.hasOne(models.Buque, {
        foreignKey: 'id',
        sourceKey: 'id_buque'
      });
      this.hasOne(models.semanas, {
        foreignKey: 'id',
        sourceKey: 'id_semana'
      });
      this.hasMany(models.Listado, { foreignKey: 'id_embarque', sourceKey: "id" });
      // define association here
    }
  }
  Embarque.init({
    id_semana: DataTypes.INTEGER,
    id_cliente: DataTypes.INTEGER,
    id_destino: DataTypes.INTEGER,
    id_naviera: DataTypes.INTEGER,
    viaje: DataTypes.STRING,
    anuncio: DataTypes.STRING,
    sae: DataTypes.STRING,
    id_buque: DataTypes.INTEGER,
    booking: DataTypes.STRING,
    bl: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    fecha_zarpe: DataTypes.DATE,
    fecha_arribo: DataTypes.DATE,
    observaciones: DataTypes.TEXT,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Embarque',
  });
  return Embarque;
};