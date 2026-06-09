'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class transportadoras_por_usuario extends Model {
    static associate(models) {
      this.hasOne(models.transportadoras, {
        as: 'transportadora',
        foreignKey: 'id',
        sourceKey: 'id_transportadora'
      });
    }
  }

  transportadoras_por_usuario.init({
    id_transportadora: DataTypes.INTEGER,
    username: DataTypes.STRING,
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'transportadoras_por_usuario',
    tableName: 'transportadoras_por_usuarios'
  });

  return transportadoras_por_usuario;
};
