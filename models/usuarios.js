'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class usuarios extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  usuarios.init({
    username: DataTypes.STRING,
    nombre: DataTypes.STRING,
    apellido: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    recovery_token: DataTypes.STRING,
    password_changed_at: DataTypes.DATE,
    password_reminder_sent_at: DataTypes.DATE,
    password_blocked_at: DataTypes.DATE,
    tel: DataTypes.STRING,
    id_rol: DataTypes.STRING,
    isBlock: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'usuarios',
  });
  return usuarios;
};
