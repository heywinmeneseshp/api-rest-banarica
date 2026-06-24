'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RegistroTemperatura extends Model {
    static associate(models) {
      this.belongsTo(models.serial_de_articulos, {
        foreignKey: 'id_serial_articulo',
        targetKey: 'id',
        as: 'serial'
      });
    }
  }
  RegistroTemperatura.init({
    id_serial_articulo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hora: {
      type: DataTypes.TIME,
      allowNull: false
    },
    temperatura: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'RegistroTemperatura',
  });
  return RegistroTemperatura;
};
