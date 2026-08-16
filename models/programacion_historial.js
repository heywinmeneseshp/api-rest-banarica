'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class programacion_historial extends Model {
    static associate() {
      // Sin FK real a programacion: el historial debe sobrevivir aunque la
      // fila original se elimine (delete() hace un hard delete).
    }
  }
  programacion_historial.init({
    programacion_id: DataTypes.INTEGER,
    accion: DataTypes.ENUM('creado', 'editado', 'eliminado'),
    usuario: DataTypes.STRING,
    contenedor: DataTypes.STRING,
    bl: DataTypes.STRING,
    semana: DataTypes.STRING,
    datos_anteriores: DataTypes.JSON,
    datos_nuevos: DataTypes.JSON,
  }, {
    sequelize,
    modelName: 'programacion_historial',
    tableName: 'programacion_historial',
  });
  return programacion_historial;
};
