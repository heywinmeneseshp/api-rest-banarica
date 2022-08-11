'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class traslados extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.historial_movimientos, {
        as: 'traslado',
        foreignKey: 'cons_movimiento',
        sourceKey: 'consecutivo'
      })
      // define association here
    }
  }
  traslados.init({
    consecutivo: DataTypes.STRING,
    transportadora: DataTypes.STRING,
    conductor: DataTypes.STRING,
    vehiculo: DataTypes.STRING,
    origen: DataTypes.STRING,
    destino: DataTypes.STRING,
    semana: DataTypes.STRING,
    fecha_salida: DataTypes.STRING,
    fecha_entrada: DataTypes.STRING,
    estado: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'traslados',
  });
  return traslados;
};
