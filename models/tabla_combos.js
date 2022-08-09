'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tabla_combos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.combos, {
        foreignKey: 'cons_combo',
        as: 'combo',
      });
      // define association here
    }
  }
  tabla_combos.init({
    cons_combo: DataTypes.STRING,
    cons_producto: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'tabla_combos',
  });
  return tabla_combos;
};
