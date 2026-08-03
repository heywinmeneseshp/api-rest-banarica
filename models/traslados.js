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
      this.belongsTo(models.historial_movimientos, {
        as: 'traslado',
        foreignKey: 'consecutivo',
        sourceKey: 'cons_movimiento'
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
    observaciones: DataTypes.STRING,
    fecha_salida: DataTypes.STRING,
    fecha_entrada: DataTypes.STRING,
    estado: DataTypes.STRING,
    evidencia_cargada: DataTypes.BOOLEAN,
    evidencia_carpeta_id: DataTypes.STRING,
    evidencia_carpeta_url: DataTypes.STRING,
    evidencia_fecha: DataTypes.DATE,
    evidencia_total_fotos: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'traslados',
  });
  return traslados;
};
