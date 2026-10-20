'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class comunicado_destinatarios extends Model {
    static associate(models) {
      comunicado_destinatarios.belongsTo(models.comunicados, { foreignKey: 'comunicado_id', as: 'comunicado' });
    }
  }
  comunicado_destinatarios.init({
    comunicado_id: DataTypes.INTEGER,
    username: DataTypes.STRING,
    leido_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'comunicado_destinatarios',
  });
  return comunicado_destinatarios;
};
