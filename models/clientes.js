'use strict';
const { Model } = require('sequelize');

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
    razon_social: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    domicilio: {
      type: DataTypes.STRING,
      allowNull: true
    },
    telefono: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    cod: {
      type: DataTypes.STRING,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    pais: {
      type: DataTypes.STRING,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    }
  }, {
    sequelize,
    modelName: 'clientes',
  });

  return clientes;
};
