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
  // Webhook a api-rest-corbana: se llama al terminar de cargar un Excel de
  // Programación de Corte, para avisarle a Corbana que traiga esa semana de
  // nuevo — así no tienen que apretar "Sincronizar" a mano allá. En espejo
  // de nuestro propio API_KEY, pero para el sentido inverso.
  corbanaApiUrl: process.env.CORBANA_API_URL || '',
  corbanaApiKey: process.env.CORBANA_API_KEY || '',
  // Docs de Swagger en /api-docs. Prendidas por defecto fuera de produccion;
  // en produccion quedan apagadas salvo que se ponga SWAGGER_ENABLED=true
  // explicitamente (evita exponer el mapa completo de endpoints por defecto).
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
};

module.exports = env;

