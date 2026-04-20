'use strict';

const bcrypt = require('bcryptjs');

const now = new Date();
const currentYear = now.getFullYear();
const startOfYear = new Date(currentYear, 0, 1);
const currentWeek = Math.max(1, Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7));

const defaultWeekOneMonday = (() => {
  const janFirst = new Date(Date.UTC(currentYear, 0, 1));
  const day = janFirst.getUTCDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  janFirst.setUTCDate(janFirst.getUTCDate() + distanceToMonday);
  return janFirst.toISOString().slice(0, 10);
})();

const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@predetermimado.local';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123*';

const defaultEmpresa = {
  id: 1,
  razonSocial: 'CI Bana Rica SA',
  nombreComercial: 'Bana Rica',
  nit: '900000000-1',
  domicilio: 'Predeterminado',
  correo: 'info@predetermimado.local',
  telefono: '3000000000',
  createdAt: now,
  updatedAt: now
};

const defaultAlmacen = {
  consecutivo: 'PRE',
  nombre: 'Principal',
  razon_social: 'CI Bana Rica SA',
  direccion: 'Predeterminado',
  telefono: '3000000000',
  email: 'almacen@predetermimado.local',
  isBlock: false,
  createdAt: now,
  updatedAt: now
};

const defaultCategoria = {
  consecutivo: 'PRE',
  nombre: 'Predeterminado',
  isBlock: false,
  createdAt: now,
  updatedAt: now
};

const defaultProveedor = {
  consecutivo: 'PV-0',
  razon_social: 'Proveedor predeterminado',
  direccion: 'Predeterminado',
  tel: '3000000000',
  email: 'proveedor@predetermimado.local',
  isBlock: false,
  createdAt: now,
  updatedAt: now
};

const defaultCategoriaVehiculo = {
  categoria: 'Predeterminado',
  galones_por_kilometro: 0,
  activo: true,
  createdAt: now,
  updatedAt: now
};

const defaultTransportadora = {
  consecutivo: 'TRANS-0',
  razon_social: 'Transportadora predeterminada',
  direccion: 'Predeterminado',
  tel: '3000000000',
  email: 'transportadora@predetermimado.local',
  isBlock: false,
  createdAt: now,
  updatedAt: now
};

const defaultConductor = {
  consecutivo: 'COND-0',
  conductor: 'Conductor predeterminado',
  cons_transportadora: defaultTransportadora.consecutivo,
  email: 'conductor@predetermimado.local',
  tel: '3000000000',
  licencia: 'PRED',
  isBlock: false,
  createdAt: now,
  updatedAt: now
};

const defaultNaviera = {
  navieras: 'Predeterminado',
  cod: 'PRE',
  habilitado: true,
  createdAt: now,
  updatedAt: now
};

const defaultBuque = {
  buque: 'Predeterminado',
  habilitado: true,
  createdAt: now,
  updatedAt: now
};

const defaultCliente = {
  razon_social: 'Cliente predeterminado',
  nit: '000000000',
  domicilio: 'Predeterminado',
  telefono: 300000000,
  email: 'cliente@predetermimado.local',
  activo: true,
  cod: 'CLI-0',
  pais: 'Colombia',
  createdAt: now,
  updatedAt: now
};

const defaultCombo = {
  consecutivo: 'CMB-0',
  nombre: 'Combo predeterminado',
  isBlock: false,
  id_cliente: null,
  cajas_por_palet: 0,
  cajas_por_mini_palet: 0,
  palets_por_contenedor: 0,
  peso_neto: 0,
  peso_bruto: 0,
  precio_de_venta: 0,
  createdAt: now,
  updatedAt: now
};

const defaultSemana = {
  consecutivo: 'S00-2000',
  semana: '0',
  anho: '2000',
  createdAt: now,
  updatedAt: now
};

const defaultVehiculo = {
  vehiculo: 'Predeterminado',
  modelo: 'Predeterminado',
  placa: 'PRE-000',
  conductor_id: defaultConductor.consecutivo,
  categoria_id: null,
  combustible: 0,
  gal_por_km: 0,
  activo: true,
  createdAt: now,
  updatedAt: now
};

const defaultProducto = {
  consecutivo: 'PRO000',
  name: 'Predeterminado',
  bulto: 0,
  cons_categoria: defaultCategoria.consecutivo,
  cons_proveedor: defaultProveedor.consecutivo,
  salida_sin_stock: false,
  serial: false,
  permitir_traslados: false,
  costo: 0,
  isBlock: false,
  createdAt: now,
  updatedAt: now
};

const defaultRelacionAlmacen = {
  id_almacen: defaultAlmacen.consecutivo,
  username: adminUsername,
  habilitado: true,
  createdAt: now,
  updatedAt: now
};

const defaultConfiguracionSemana = {
  modulo: 'Semana',
  anho_actual: currentYear,
  habilitado: true,
  semana_actual: currentWeek,
  semana_siguiente: currentWeek + 1,
  semana_previa: Math.max(currentWeek - 1, 1),
  fecha_inicio_semana_1: defaultWeekOneMonday,
  total_semanas_anho: 52,
  detalles: 'Configuracion inicial',
  mes_reporte: now.getMonth() + 1,
  sem_reporte: currentWeek,
  email_reporte: adminEmail,
  createdAt: now,
  updatedAt: now
};

module.exports = {
  async up(queryInterface) {
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const empresaId = await queryInterface.rawSelect(
        'Empresas',
        { where: { id: defaultEmpresa.id }, transaction },
        'id'
      );

      if (!empresaId) {
        await queryInterface.bulkInsert('Empresas', [defaultEmpresa], { transaction });
      }

      const adminUser = await queryInterface.rawSelect(
        'usuarios',
        { where: { username: adminUsername }, transaction },
        'username'
      );

      if (!adminUser) {
        await queryInterface.bulkInsert('usuarios', [{
          username: adminUsername,
          nombre: 'Administrador',
          apellido: 'General',
          email: adminEmail,
          password: adminHash,
          recovery_token: null,
          password_changed_at: now,
          password_reminder_sent_at: null,
          password_blocked_at: null,
          tel: '3000000000',
          id_rol: 'Super administrador',
          isBlock: false,
          createdAt: now,
          updatedAt: now
        }], { transaction });
      }

      const almacenId = await queryInterface.rawSelect(
        'almacenes',
        { where: { consecutivo: defaultAlmacen.consecutivo }, transaction },
        'consecutivo'
      );

      if (!almacenId) {
        await queryInterface.bulkInsert('almacenes', [defaultAlmacen], { transaction });
      }

      const relacionId = await queryInterface.rawSelect(
        'almacenes_por_usuarios',
        { where: { username: adminUsername, id_almacen: defaultAlmacen.consecutivo }, transaction },
        'id'
      );

      if (!relacionId) {
        await queryInterface.bulkInsert('almacenes_por_usuarios', [defaultRelacionAlmacen], { transaction });
      }

      const categoriaId = await queryInterface.rawSelect(
        'categorias',
        { where: { consecutivo: defaultCategoria.consecutivo }, transaction },
        'consecutivo'
      );

      if (!categoriaId) {
        await queryInterface.bulkInsert('categorias', [defaultCategoria], { transaction });
      }

      const proveedorId = await queryInterface.rawSelect(
        'proveedores',
        { where: { consecutivo: defaultProveedor.consecutivo }, transaction },
        'consecutivo'
      );

      if (!proveedorId) {
        await queryInterface.bulkInsert('proveedores', [defaultProveedor], { transaction });
      }

      const productoId = await queryInterface.rawSelect(
        'productos',
        { where: { consecutivo: defaultProducto.consecutivo }, transaction },
        'consecutivo'
      );

      if (!productoId) {
        await queryInterface.bulkInsert('productos', [defaultProducto], { transaction });
      }

      let categoriaVehiculoId = await queryInterface.rawSelect(
        'categoria_vehiculos',
        { where: { categoria: defaultCategoriaVehiculo.categoria }, transaction },
        'id'
      );

      if (!categoriaVehiculoId) {
        await queryInterface.bulkInsert('categoria_vehiculos', [defaultCategoriaVehiculo], { transaction });
        categoriaVehiculoId = await queryInterface.rawSelect(
          'categoria_vehiculos',
          { where: { categoria: defaultCategoriaVehiculo.categoria }, transaction },
          'id'
        );
      }

      const transportadoraId = await queryInterface.rawSelect(
        'transportadoras',
        { where: { consecutivo: defaultTransportadora.consecutivo }, transaction },
        'consecutivo'
      );

      if (!transportadoraId) {
        await queryInterface.bulkInsert('transportadoras', [defaultTransportadora], { transaction });
      }

      const conductorId = await queryInterface.rawSelect(
        'conductores',
        { where: { consecutivo: defaultConductor.consecutivo }, transaction },
        'consecutivo'
      );

      if (!conductorId) {
        await queryInterface.bulkInsert('conductores', [defaultConductor], { transaction });
      }

      let navieraId = await queryInterface.rawSelect(
        'Navieras',
        { where: { navieras: defaultNaviera.navieras }, transaction },
        'id'
      );

      if (!navieraId) {
        await queryInterface.bulkInsert('Navieras', [defaultNaviera], { transaction });
        navieraId = await queryInterface.rawSelect(
          'Navieras',
          { where: { navieras: defaultNaviera.navieras }, transaction },
          'id'
        );
      }

      const buqueId = await queryInterface.rawSelect(
        'Buques',
        { where: { buque: defaultBuque.buque, id_naviera: navieraId }, transaction },
        'id'
      );

      if (!buqueId) {
        await queryInterface.bulkInsert('Buques', [{ ...defaultBuque, id_naviera: navieraId }], { transaction });
      }

      const clienteId = await queryInterface.rawSelect(
        'clientes',
        { where: { cod: defaultCliente.cod }, transaction },
        'cod'
      );

      if (!clienteId) {
        await queryInterface.bulkInsert('clientes', [defaultCliente], { transaction });
      }

      const comboId = await queryInterface.rawSelect(
        'combos',
        { where: { consecutivo: defaultCombo.consecutivo }, transaction },
        'consecutivo'
      );

      if (!comboId) {
        await queryInterface.bulkInsert('combos', [defaultCombo], { transaction });
      }

      const vehiculoId = await queryInterface.rawSelect(
        'vehiculos',
        { where: { placa: 'PRE-000' }, transaction },
        'id'
      );

      if (!vehiculoId) {
        await queryInterface.bulkInsert('vehiculos', [{
          ...defaultVehiculo,
          categoria_id: categoriaVehiculoId ? String(categoriaVehiculoId) : null
        }], { transaction });
      }

      const semanaId = await queryInterface.rawSelect(
        'semanas',
        { where: { consecutivo: defaultSemana.consecutivo }, transaction },
        'consecutivo'
      );

      if (!semanaId) {
        await queryInterface.bulkInsert('semanas', [defaultSemana], { transaction });
      }

      const configSemanaId = await queryInterface.rawSelect(
        'configuracions',
        { where: { modulo: defaultConfiguracionSemana.modulo }, transaction },
        'id'
      );

      if (!configSemanaId) {
        await queryInterface.bulkInsert('configuracions', [defaultConfiguracionSemana], { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete(
        'configuracions',
        { modulo: defaultConfiguracionSemana.modulo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'productos',
        { consecutivo: defaultProducto.consecutivo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'proveedores',
        { consecutivo: defaultProveedor.consecutivo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'categorias',
        { consecutivo: defaultCategoria.consecutivo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'vehiculos',
        { placa: defaultVehiculo.placa },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'combos',
        { consecutivo: defaultCombo.consecutivo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'clientes',
        { cod: defaultCliente.cod },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'Buques',
        { buque: defaultBuque.buque },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'Navieras',
        { navieras: defaultNaviera.navieras },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'conductores',
        { consecutivo: defaultConductor.consecutivo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'transportadoras',
        { consecutivo: defaultTransportadora.consecutivo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'categoria_vehiculos',
        { categoria: defaultCategoriaVehiculo.categoria },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'semanas',
        { consecutivo: defaultSemana.consecutivo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'almacenes_por_usuarios',
        { username: adminUsername, id_almacen: defaultAlmacen.consecutivo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'almacenes',
        { consecutivo: defaultAlmacen.consecutivo },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'usuarios',
        { username: adminUsername },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'Empresas',
        { id: defaultEmpresa.id },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
