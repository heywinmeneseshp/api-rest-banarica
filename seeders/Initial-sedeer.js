// seeders/initial-data-seeder.js
const { Role, Setting } = require('../models'); // Ajusta según tus modelos
const usuarioService = require('../services/usuarios.service')

const service = new usuarioService();

class InitialDataSeeder {
  constructor() {
    this.hasRun = false;
  }

  async run() {
    // Evitar ejecución múltiple
    if (this.hasRun) return;
    
    try {
      // Verificar si ya existen datos
      const userCount = await service.find()
      
      if (userCount === 0) {
        console.log('🌱 Ejecutando seeders iniciales...');
        
        // Crear roles por defecto
        const roles = await this.createDefaultRoles();
        
        // Crear usuario administrador
        const adminUser = await this.createAdminUser(roles);
        
        // Crear configuraciones por defecto
        await this.createDefaultSettings();
        
        console.log('✅ Seeders ejecutados correctamente');
        this.hasRun = true;
      } else {
        console.log('ℹ️ Los datos ya existen, omitiendo seeders');
      }
    } catch (error) {
      console.error('❌ Error ejecutando seeders:', error);
      throw error;
    }
  }

  async createDefaultRoles() {
    const defaultRoles = [
      { name: 'admin', description: 'Administrador del sistema' },
      { name: 'user', description: 'Usuario regular' },
      { name: 'guest', description: 'Invitado' }
    ];

    const roles = [];
    for (const roleData of defaultRoles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData
      });
      roles.push(role);
    }
    return roles;
  }

  async createAdminUser(roles) {
    const adminRole = roles.find(r => r.name === 'admin');
    
    const [user, created] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin', // En producción, usa hash!
        roleId: adminRole.id,
        isActive: true
      }
    });

    if (created) {
      console.log('👤 Usuario administrador creado: admin@example.com / admin123');
    }
    
    return user;
  }

  async createDefaultSettings() {
    const defaultSettings = [
      { key: 'app_name', value: 'Mi Aplicación', type: 'string' },
      { key: 'items_per_page', value: '10', type: 'number' },
      { key: 'maintenance_mode', value: 'false', type: 'boolean' }
    ];

    for (const setting of defaultSettings) {
      await Setting.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });
    }
  }
}

module.exports = new InitialDataSeeder();