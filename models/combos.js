'use strict';
const { Model } = require('sequelize');

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
    consecutivo: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    isBlock: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    cajas_por_palet: {
      type: DataTypes.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    cajas_por_mini_palet: {
      type: DataTypes.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    palets_por_contenedor: {
      type: DataTypes.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    peso_neto: {
      type: DataTypes.FLOAT,  // O DECIMAL si necesitas precisión
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    peso_bruto: {
      type: DataTypes.FLOAT,  // O DECIMAL si necesitas precisión
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    precio_de_venta: {
      type: DataTypes.FLOAT,  // O DECIMAL si necesitas precisión
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    }
  }, {
    sequelize,
    modelName: 'combos',
  });

  return combos;
};
