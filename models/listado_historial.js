'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class listado_historial extends Model {
    static associate() {
      // Sin FK real a Listado: el historial debe sobrevivir aunque la fila
      // original se elimine (delete() hace un hard delete).
    }
  }
  listado_historial.init({
    listado_id: DataTypes.INTEGER,
    accion: DataTypes.ENUM('creado', 'editado', 'eliminado', 'restaurado'),
    usuario: DataTypes.STRING,
    contenedor: DataTypes.STRING,
    datos_anteriores: DataTypes.JSON,
    datos_nuevos: DataTypes.JSON,
  }, {
    sequelize,
    modelName: 'listado_historial',
    tableName: 'listado_historial',
  });
  return listado_historial;
};
