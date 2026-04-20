const express = require("express");
const cors = require('cors');
const path = require('path');
const routerApi = require('./routes');
const { checkApiKey } = require('./middlewares/auth.handler');
const env = require('./config/env');
const { bootstrapInitialData } = require('./utils/bootstrap');
const { PasswordPolicyService } = require('./services/password-policy.service');

// Middlewares error
const { logErrors, errorHandler, boomErrorHandler } = require('./middlewares/error.handler');

const app = express();
const passwordPolicyService = new PasswordPolicyService();
const port = process.env.PORT || 3000 || process.env.PORT2;
const whitelist = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Configura el limite del tamano del cuerpo de la solicitud
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.length === 0 || whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use('/static', express.static(path.join(__dirname, 'public')));

require('./utils/auth');

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/recovery', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recovery', 'index.html'));
});

app.get("/", checkApiKey, (req, res) => {
  res.send("<h3>Hola, soy el servidor de la CI Banarica SA</h3>");
});

routerApi(app);

app.use(logErrors);
app.use(boomErrorHandler);
app.use(errorHandler);

async function startServer() {
  try {
    const bootstrapResult = await bootstrapInitialData();
    await passwordPolicyService.startScheduler();

    if (bootstrapResult.ran) {
      console.log(`Initial bootstrap completed for user ${bootstrapResult.admin}`);
    }

    app.listen(port, () => {
      console.log("My port " + port);
    });
  } catch (error) {
    console.error('Server bootstrap failed', error);
    process.exit(1);
  }
}

startServer();
