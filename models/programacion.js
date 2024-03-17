'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class programacion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      programacion.hasMany(models.productos_viajes, {
        foreignKey: 'programacion_id'
      });

      programacion.hasOne(models.conductores, {
        foreignKey: "id",
        sourceKey: "conductor_id",
        as: "conductor"
      })

      programacion.hasOne(models.clientes, {
        foreignKey: "id",
        sourceKey: "id_pagador_flete",
      })

      programacion.hasOne(models.rutas, {
        foreignKey: "id",
        sourceKey: "ruta_id",
      })

      programacion.hasOne(models.vehiculo, {
        foreignKey: "id",
        sourceKey: "vehiculo_id",
      })




    }
  }
  programacion.init({
    ruta_id: DataTypes.STRING,
    cobrar: DataTypes.BOOLEAN,
    id_pagador_flete: DataTypes.STRING,
    activo: DataTypes.BOOLEAN,
    movimiento: DataTypes.STRING,
    conductor_id: DataTypes.STRING,
    vehiculo_id: DataTypes.STRING,
    contenedor: DataTypes.STRING,
    semana: DataTypes.STRING,
    fecha: DataTypes.STRING,
    detalles: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'programacion',
  });
  return programacion;
};