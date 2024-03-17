'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class productos_viajes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */


    static associate(models) {
      // Definir la asociación aquí
      productos_viajes.belongsTo(models.programacion, {
        foreignKey: 'programacion_id'
      });


      
    }
  }
  productos_viajes.init({

    programacion_id: DataTypes.STRING,
    producto_id: DataTypes.STRING,
    unidad_de_medida: DataTypes.STRING,
    cantidad: DataTypes.FLOAT,
    activo: DataTypes.BOOLEAN,

  }, {
    sequelize,
    modelName: 'productos_viajes',
  });

  return productos_viajes;
};