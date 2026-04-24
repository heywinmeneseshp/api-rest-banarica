'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Inspeccion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Inspeccion.init({
    id_contenedor: DataTypes.INTEGER,
    cons_movimiento: DataTypes.STRING,
    fecha_inspeccion: DataTypes.DATE,
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La hora de inicio es requerida'
        }
      }
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: 'La hora final es requerida'
        }
      }
    },
    agente: DataTypes.STRING(100),
    zona: DataTypes.STRING(100), 
      observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    habilitado: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Inspeccion',
  });
  return Inspeccion;
};
