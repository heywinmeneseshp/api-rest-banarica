'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class serial_de_articulos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.productos, {
        as: "producto",
        foreignKey: 'consecutivo',
        sourceKey: 'cons_producto'
      });

      this.hasOne(models.movimientos, {
        as: "movimiento",
        foreignKey: 'consecutivo',
        sourceKey: 'cons_movimiento'
      });

      // Define additional associations if needed
    }
  }

  serial_de_articulos.init({
    cons_producto: {
      type: DataTypes.STRING,
      allowNull: true
    },
    serial: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    bag_pack: {
      type: DataTypes.STRING,
      allowNull: true
    },
    s_pack: {
      type: DataTypes.STRING,
      allowNull: true
    },
    m_pack: {
      type: DataTypes.STRING,
      allowNull: true
    },
    l_pack: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cons_almacen: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cons_movimiento: {
      type: DataTypes.STRING,
      allowNull: true
    },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    id_contenedor: {
      type: DataTypes.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    fecha_de_uso: {
      type: DataTypes.DATE,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    id_motivo_de_uso: {
      type: DataTypes.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true  // Cambiar a false si la columna no puede ser nula
    },
    ubicacion_en_contenedor: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'serial_de_articulos',
  });

  return serial_de_articulos;
};
