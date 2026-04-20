const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const db = require('../models');
const env = require('../config/env');
const { ROLES } = require('../middlewares/auth.handler');

function calculateCurrentWeek(date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  return Math.max(1, Math.ceil((((date - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7));
}

function getDefaultWeekOneMonday(date = new Date()) {
  const janFirst = new Date(Date.UTC(date.getFullYear(), 0, 1));
  const day = janFirst.getUTCDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  janFirst.setUTCDate(janFirst.getUTCDate() + distanceToMonday);
  return janFirst.toISOString().slice(0, 10);
}

async function bootstrapInitialData() {
  if (!env.autoBootstrap) {
    return { ran: false, reason: 'disabled' };
  }

  await db.usuarios.update(
    { id_rol: ROLES.OPERADOR },
    { where: { id_rol: { [Op.in]: ['Administrador', 'Seguridad', 'Super seguridad'] } } }
  );

  const userCount = await db.usuarios.count();
  if (userCount > 0) {
    return { ran: false, reason: 'existing-users', users: userCount };
  }

  const transaction = await db.sequelize.transaction();

  try {
    const now = new Date();
    const currentWeek = calculateCurrentWeek(now);
    const adminPasswordHash = await bcrypt.hash(env.seedAdminPassword, 10);

    await db.Empresa.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        razonSocial: 'CI Bana Rica SA',
        nombreComercial: 'Bana Rica',
        nit: '900000000-1',
        domicilio: 'Predeterminado',
        correo: 'info@banarica.local',
        telefono: '3000000000'
      },
      transaction
    });

    await db.usuarios.findOrCreate({
      where: { username: env.seedAdminUsername },
      defaults: {
        username: env.seedAdminUsername,
        nombre: 'Administrador',
        apellido: 'General',
        email: env.seedAdminEmail,
        password: adminPasswordHash,
        recovery_token: null,
        tel: '3000000000',
        id_rol: ROLES.SUPER_ADMIN,
        isBlock: false
      },
      transaction
    });

    await db.almacenes.findOrCreate({
      where: { consecutivo: 'PRE' },
      defaults: {
        consecutivo: 'PRE',
        nombre: 'Principal',
        razon_social: 'CI Bana Rica SA',
        direccion: 'Predeterminado',
        telefono: '3000000000',
        email: 'almacen@banarica.local',
        isBlock: false
      },
      transaction
    });

    await db.almacenes_por_usuario.findOrCreate({
      where: { username: env.seedAdminUsername, id_almacen: 'PRE' },
      defaults: {
        username: env.seedAdminUsername,
        id_almacen: 'PRE',
        habilitado: true
      },
      transaction
    });

    await db.categorias.findOrCreate({
      where: { consecutivo: 'PRE' },
      defaults: {
        consecutivo: 'PRE',
        nombre: 'Predeterminado',
        isBlock: false
      },
      transaction
    });

    await db.proveedores.findOrCreate({
      where: { consecutivo: 'PV-0' },
      defaults: {
        consecutivo: 'PV-0',
        razon_social: 'Proveedor predeterminado',
        direccion: 'Predeterminado',
        tel: '3000000000',
        email: 'proveedor@banarica.local',
        isBlock: false
      },
      transaction
    });

    await db.productos.findOrCreate({
      where: { consecutivo: 'PRO000' },
      defaults: {
        consecutivo: 'PRO000',
        name: 'Predeterminado',
        bulto: 0,
        cons_categoria: 'PRE',
        cons_proveedor: 'PV-0',
        salida_sin_stock: false,
        serial: false,
        permitir_traslados: false,
        costo: 0,
        isBlock: false
      },
      transaction
    });

    await db.configuracion.findOrCreate({
      where: { modulo: 'Semana' },
      defaults: {
        modulo: 'Semana',
        anho_actual: now.getFullYear(),
        fecha_inicio_semana_1: getDefaultWeekOneMonday(now),
        total_semanas_anho: 52,
        habilitado: true,
        semana_actual: currentWeek,
        semana_siguiente: currentWeek + 1,
        semana_previa: Math.max(currentWeek - 1, 1),
        detalles: 'Configuracion inicial automatica',
        mes_reporte: now.getMonth() + 1,
        sem_reporte: currentWeek,
        email_reporte: env.seedAdminEmail
      },
      transaction
    });

    await transaction.commit();

    return {
      ran: true,
      reason: 'bootstrapped',
      admin: env.seedAdminUsername
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { bootstrapInitialData };
