'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transportadoras_por_usuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_transportadora: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'transportadoras',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      habilitado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('transportadoras_por_usuarios', ['username', 'id_transportadora'], {
      unique: true,
      name: 'transportadoras_por_usuarios_username_transportadora_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transportadoras_por_usuarios');
  }
};
