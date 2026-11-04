'use strict';

// Modulo "Costos logisticos" (antes "Auxiliar Logistico" de la app Trazabilidad):
// facturas con sus items, catalogos y TRM. Las fechas se guardan como texto
// 'YYYY-MM-DD' (igual que en Trazabilidad) para evitar problemas de zona horaria.
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const existe = (nombre) => tables.includes(nombre);
    const ts = {
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    };

    if (!existe('costos_proveedores')) {
      await queryInterface.createTable('costos_proveedores', {
        nit: { type: Sequelize.STRING(40), primaryKey: true, allowNull: false },
        nombre: { type: Sequelize.STRING(200), allowNull: false },
        razon_social: { type: Sequelize.STRING(250), allowNull: true },
        ...ts,
      });
    }

    if (!existe('costos_estados_factura')) {
      await queryInterface.createTable('costos_estados_factura', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: Sequelize.STRING(120), allowNull: false, unique: true },
        color: { type: Sequelize.STRING(20), allowNull: false, defaultValue: '#6c757d' },
        descripcion: { type: Sequelize.STRING(300), allowNull: true },
        ...ts,
      });
      await queryInterface.bulkInsert('costos_estados_factura', [
        ['Pendiente por revisión', '#fd7e14', 'Factura recibida, pendiente de verificar'],
        ['En revisión', '#0dcaf0', 'Siendo revisada actualmente'],
        ['Aprobada', '#198754', 'Revisada y aprobada para pago'],
        ['Pendiente Nota Crédito', '#6f42c1', 'Se espera nota crédito del proveedor'],
        ['En disputa', '#dc3545', 'Hay discrepancia con el proveedor'],
        ['Pagada', '#20c997', 'Factura pagada'],
      ].map(([nombre, color, descripcion]) => ({ nombre, color, descripcion })));
    }

    if (!existe('costos_tipos_documento')) {
      await queryInterface.createTable('costos_tipos_documento', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: Sequelize.STRING(120), allowNull: false, unique: true },
        sentido: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'resta' },
        descripcion: { type: Sequelize.STRING(300), allowNull: true },
        ...ts,
      });
      await queryInterface.bulkInsert('costos_tipos_documento', [
        ['Factura', 'resta', 'Factura de cobro — sale dinero'],
        ['Nota Débito', 'resta', 'Cargo adicional — sale dinero'],
        ['Nota Crédito', 'suma', 'Devolución o descuento — entra dinero'],
        ['Anticipo', 'resta', 'Pago anticipado — sale dinero'],
        ['Recibo de Caja', 'suma', 'Ingreso de efectivo — entra dinero'],
      ].map(([nombre, sentido, descripcion]) => ({ nombre, sentido, descripcion })));
    }

    if (!existe('costos_tipos_costo')) {
      await queryInterface.createTable('costos_tipos_costo', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        codigo: { type: Sequelize.STRING(40), allowNull: false, unique: true },
        nombre: { type: Sequelize.STRING(150), allowNull: false },
        descripcion: { type: Sequelize.STRING(300), allowNull: true },
        aplica_finca: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        aplica_puerto: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        aplica_inspeccion: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        aplica_todos: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        ...ts,
      });
      await queryInterface.bulkInsert('costos_tipos_costo', [
        { codigo: 'FINCA', nombre: 'Finca', descripcion: 'Aplica a contenedores llenados en finca', aplica_finca: 1, aplica_puerto: 0, aplica_inspeccion: 0, aplica_todos: 0 },
        { codigo: 'PUERTO', nombre: 'Puerto', descripcion: 'Aplica a contenedores llenados en puerto', aplica_finca: 0, aplica_puerto: 1, aplica_inspeccion: 0, aplica_todos: 0 },
        { codigo: 'INSPECCION', nombre: 'Inspección', descripcion: 'Aplica a contenedores con inspección antinarcóticos', aplica_finca: 0, aplica_puerto: 0, aplica_inspeccion: 1, aplica_todos: 0 },
        { codigo: 'ALL', nombre: 'Todos', descripcion: 'Aplica a todos los contenedores', aplica_finca: 0, aplica_puerto: 0, aplica_inspeccion: 0, aplica_todos: 1 },
      ]);
    }

    if (!existe('costos_items_catalog')) {
      await queryInterface.createTable('costos_items_catalog', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        codigo: { type: Sequelize.STRING(60), allowNull: true },
        nombre: { type: Sequelize.STRING(250), allowNull: false },
        descripcion: { type: Sequelize.STRING(400), allowNull: true },
        unidad: { type: Sequelize.STRING(40), allowNull: true },
        precio_ref: { type: Sequelize.DECIMAL(18, 4), allowNull: true },
        tipo_costo_default: { type: Sequelize.STRING(40), allowNull: true },
        ...ts,
      });
    }

    if (!existe('costos_trm')) {
      await queryInterface.createTable('costos_trm', {
        fecha: { type: Sequelize.STRING(10), primaryKey: true, allowNull: false },
        valor: { type: Sequelize.DECIMAL(14, 4), allowNull: false },
        ...ts,
      });
    }

    if (!existe('costos_facturas')) {
      await queryInterface.createTable('costos_facturas', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        fecha: { type: Sequelize.STRING(10), allowNull: true },
        tipo: { type: Sequelize.STRING(120), allowNull: true },
        numero_factura: { type: Sequelize.STRING(80), allowNull: true },
        nit_proveedor: { type: Sequelize.STRING(40), allowNull: true },
        total: { type: Sequelize.DECIMAL(18, 4), allowNull: true },
        estado_total: { type: Sequelize.STRING(20), allowNull: true },
        estado: { type: Sequelize.STRING(120), allowNull: true },
        ...ts,
      });
      await queryInterface.addIndex('costos_facturas', ['fecha'], { name: 'idx_costos_facturas_fecha' });
      await queryInterface.addIndex('costos_facturas', ['nit_proveedor', 'numero_factura'], { name: 'idx_costos_facturas_prov_num' });
    }

    if (!existe('costos_factura_items')) {
      await queryInterface.createTable('costos_factura_items', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        factura_id: { type: Sequelize.INTEGER, allowNull: false },
        semana: { type: Sequelize.STRING(40), allowNull: true },
        mes: { type: Sequelize.STRING(40), allowNull: true },
        anho: { type: Sequelize.STRING(10), allowNull: true },
        concepto: { type: Sequelize.STRING(300), allowNull: true },
        id_contenedor: { type: Sequelize.STRING(40), allowNull: true },
        booking: { type: Sequelize.STRING(60), allowNull: true },
        divisa: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'COP' },
        cantidad: { type: Sequelize.DECIMAL(18, 4), allowNull: true },
        valor_unitario: { type: Sequelize.DECIMAL(18, 4), allowNull: true },
        nivel_asociacion: { type: Sequelize.STRING(40), allowNull: true },
        tipo_costo: { type: Sequelize.STRING(40), allowNull: true },
        metodo_distribucion: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'por_cajas' },
        distribuido_en: { type: Sequelize.DATE, allowNull: true },
        ...ts,
      });
      await queryInterface.addIndex('costos_factura_items', ['factura_id'], { name: 'idx_costos_items_factura' });
    }
  },

  async down(queryInterface) {
    for (const t of [
      'costos_factura_items', 'costos_facturas', 'costos_trm', 'costos_items_catalog',
      'costos_tipos_costo', 'costos_tipos_documento', 'costos_estados_factura', 'costos_proveedores',
    ]) {
      await queryInterface.dropTable(t);
    }
  },
};
