'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rechazo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Contenedor, {
        foreignKey: "id_contenedor",
        targetKey: "id"
      })
      this.belongsTo(models.MotivoDeRechazo, {
        foreignKey: "id_motivo_de_rechazo",
        targetKey: "id"
      })
      this.belongsTo(models.combos, {
        foreignKey: "id_producto",
        targetKey: "id"
      })
      this.belongsTo(models.usuarios, {
        foreignKey: "id_usuario",
        targetKey: "id"
      })
      this.belongsTo(models.almacenes, {
        foreignKey: "cod_productor",
        targetKey: "consecutivo"
      })

    }
  }
  Rechazo.init({
    id_producto: DataTypes.INTEGER,
    id_motivo_de_rechazo: DataTypes.INTEGER,
    cantidad: DataTypes.INTEGER,
    serial_palet: DataTypes.STRING,
    cod_productor: DataTypes.STRING,
    // Productor del que realmente se descontaron las cajas al aprobar (puede
    // diferir de cod_productor cuando el productor original no tenia el
    // producto en el contenedor). Se necesita guardado para poder devolver o
    // ajustar el inventario correcto al eliminar o editar un rechazo aprobado.
    cod_productor_descuento: DataTypes.STRING,
    id_contenedor: DataTypes.INTEGER,
    observaciones: DataTypes.TEXT,
    id_usuario: DataTypes.INTEGER,
    habilitado: DataTypes.BOOLEAN,
    // Borrado logico: permite "Ver eliminados"/restaurar en vez de perder el
    // registro. habilitado se conserva tal cual estaba (aprobado o no) para
    // que restaurar sepa si debe volver a descontar el inventario.
    eliminado: DataTypes.BOOLEAN,
    fecha_rechazo: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Rechazo',
  });
  return Rechazo;
};