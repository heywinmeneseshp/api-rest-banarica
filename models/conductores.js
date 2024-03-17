'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class conductores extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      conductores.hasMany(models.programacion, {
        foreignKey: 'conductor_id'
      });

      
      this.hasMany(models.record_consumos, {
        foreignKey: "conductor_id",
        sourceKey: "id"
      })

      
    }

  }
  conductores.init({
    consecutivo: DataTypes.STRING,
    conductor: DataTypes.STRING,
    cons_transportadora: DataTypes.STRING,
    email: DataTypes.STRING,
    tel: DataTypes.STRING,
    licencia: DataTypes.STRING,
    isBlock: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'conductores',
  });
  return conductores;
};
