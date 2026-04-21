require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  autoBootstrap: process.env.AUTO_BOOTSTRAP !== 'false',
  apiKey: process.env.API_KEY,
  secret: process.env.SECRET,
  recoverySecret: process.env.RECOVERY_SECRET || process.env.SECRET,
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: process.env.SMTP_SECURE !== 'false',
  corsOrigin: process.env.CORS_ORIGIN || '',
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',
  seedAdminUsername: process.env.SEED_ADMIN_USERNAME || 'admin',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@banarica.local',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123*',
};

module.exports = env;

