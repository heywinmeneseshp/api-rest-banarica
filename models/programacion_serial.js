'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class programacion_serial extends Model {
    static associate(models) {
      programacion_serial.belongsTo(models.programacion, {
        foreignKey: 'programacion_id',
        as: 'programacion'
      });

      programacion_serial.belongsTo(models.serial_de_articulos, {
        foreignKey: 'serial_articulo_id',
        as: 'serial_articulo'
      });

      programacion_serial.belongsTo(models.Contenedor, {
        foreignKey: 'id_contenedor',
        as: 'contenedor'
      });

      programacion_serial.belongsTo(models.MotivoDeUso, {
        foreignKey: 'id_motivo_de_uso',
        as: 'motivo_de_uso'
      });

      programacion_serial.belongsTo(models.usuarios, {
        foreignKey: 'id_usuario',
        as: 'usuario'
      });
    }
  }

  programacion_serial.init({
    programacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    serial_articulo_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_contenedor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fecha_uso: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    semana: {
      type: DataTypes.STRING,
      allowNull: true
    },
    id_motivo_de_uso: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'programacion_serial',
    tableName: 'programacion_seriales',
  });

  return programacion_serial;
};
