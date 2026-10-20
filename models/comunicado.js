'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class comunicados extends Model {
    static associate() {}
  }
  comunicados.init({
    asunto: DataTypes.STRING(200),
    mensaje: DataTypes.TEXT,
    destinatarios_resumen: DataTypes.JSON,
    resultados: DataTypes.JSON,
    // Metadata de los adjuntos enviados: [{ nombre, tamanioBytes, tipo }].
    adjuntos: DataTypes.JSON,
    total_destinatarios: DataTypes.INTEGER,
    enviados_ok: DataTypes.INTEGER,
    enviados_error: DataTypes.INTEGER,
    created_by: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'comunicados',
  });
  return comunicados;
};
