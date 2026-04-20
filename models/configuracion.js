'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class configuracion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  configuracion.init({
    modulo: DataTypes.STRING,
    habilitado: DataTypes.BOOLEAN,
    semana_actual: DataTypes.INTEGER,
    semana_siguiente: DataTypes.INTEGER,
    semana_previa: DataTypes.INTEGER,
    anho_actual: DataTypes.INTEGER,
    fecha_inicio_semana_1: DataTypes.DATEONLY,
    total_semanas_anho: DataTypes.INTEGER,
    detalles: DataTypes.TEXT,
    mes_reporte: DataTypes.INTEGER,
    sem_reporte: DataTypes.INTEGER,
    email_reporte: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'configuracion',
  });
  return configuracion;
};
