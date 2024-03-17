'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class clientes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.programacion, {
        foreignKey: 'id_pagador_flete'
      });

      
    }
  }
  clientes.init({
    razon_social: DataTypes.STRING,
    nit: DataTypes.STRING,
    domicilio: DataTypes.STRING,
    telefono: DataTypes.INTEGER,
    email: DataTypes.STRING,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'clientes',
  });
  return clientes;
};