'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class record_consumos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.vehiculo, {
        sourceKey: "vehiculo_id",
        foreignKey: "id"
      })

      this.hasOne(models.conductores, {
        foreignKey: "id",
        sourceKey: "conductor_id"
      })

      
      this.hasMany(models.programacion, {
        sourceKey: "vehiculo_id",
        foreignKey: "vehiculo_id"
      })


    }
  }
  record_consumos.init({
    fecha: DataTypes.STRING,
    semana: DataTypes.STRING,
    vehiculo_id: DataTypes.STRING,
    conductor_id: DataTypes.STRING,
    stock_inicial: DataTypes.FLOAT,
    stock_final: DataTypes.FLOAT,
    stock_real: DataTypes.FLOAT,
    tanqueo: DataTypes.FLOAT,
    km_recorridos: DataTypes.FLOAT,
    gal_por_km:  DataTypes.FLOAT,
    detalle: DataTypes.STRING,
    activo: DataTypes.BOOLEAN,
    liquidado: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'record_consumos',
  });
  
  return record_consumos;
};