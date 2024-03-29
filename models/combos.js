'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class combos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.tabla_combos, {
        foreignKey: 'cons_combo',
        as: 'tabla_combos'
      });
      // define association here
    }
  }
  combos.init({
    consecutivo: DataTypes.STRING,
    nombre: DataTypes.STRING,
    isBlock: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'combos',
  });
  return combos;
};
