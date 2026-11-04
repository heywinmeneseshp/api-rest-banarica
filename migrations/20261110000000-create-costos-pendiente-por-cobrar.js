'use strict';

// Costos logisticos: seguimiento de cobros pendientes a terceros (errores de otros que
// hay que cobrar). Un cobro nace al marcar un item de factura con un tercero.
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const existe = (nombre) => tables.includes(nombre);
    const ts = {
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    };

    if (!existe('costos_terceros')) {
      await queryInterface.createTable('costos_terceros', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        tipo: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'otro' },
        nombre: { type: Sequelize.STRING(200), allowNull: false },
        nit: { type: Sequelize.STRING(40), allowNull: true },
        ...ts,
      });
    }

    if (!existe('costos_estados_cobro')) {
      await queryInterface.createTable('costos_estados_cobro', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: Sequelize.STRING(120), allowNull: false, unique: true },
        color: { type: Sequelize.STRING(20), allowNull: false, defaultValue: '#6c757d' },
        descripcion: { type: Sequelize.STRING(300), allowNull: true },
        ...ts,
      });
      await queryInterface.bulkInsert('costos_estados_cobro', [
        ['Pendiente por cobrar', '#fd7e14', 'Aún no se le ha cobrado al tercero'],
        ['Cobrado', '#0dcaf0', 'Ya se le envió el cobro al tercero'],
        ['Pagado', '#198754', 'El tercero ya pagó'],
        ['En disputa', '#dc3545', 'El tercero no está de acuerdo'],
        ['Anulado', '#6c757d', 'Ya no se va a cobrar'],
      ].map(([nombre, color, descripcion]) => ({ nombre, color, descripcion })));
    }

    if (!existe('costos_cobros')) {
      await queryInterface.createTable('costos_cobros', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        item_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
        tercero_id: { type: Sequelize.INTEGER, allowNull: false },
        motivo: { type: Sequelize.STRING(500), allowNull: true },
        estado: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'Pendiente por cobrar' },
        fecha_cobro: { type: Sequelize.STRING(10), allowNull: true },
        fecha_pago: { type: Sequelize.STRING(10), allowNull: true },
        ...ts,
      });
      await queryInterface.addIndex('costos_cobros', ['tercero_id'], { name: 'idx_costos_cobros_tercero' });
    }
  },

  async down(queryInterface) {
    for (const t of ['costos_cobros', 'costos_estados_cobro', 'costos_terceros']) {
      await queryInterface.dropTable(t);
    }
  },
};
