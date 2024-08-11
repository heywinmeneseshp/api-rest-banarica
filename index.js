const express = require("express");
const cors = require('cors');
const routerApi = require('./routes');
const { checkApiKey } = require('./middlewares/auth.handler');

// Middlewares error
const { logErrors, errorHandler, boomErrorHandler } = require('./middlewares/error.handler');

const app = express();
const port = process.env.PORT || 3000 || process.env.PORT2;

// Configura el límite del tamaño del cuerpo de la solicitud
app.use(express.json({ limit: '10mb' })); // Ajusta el límite según tus necesidades
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Ajusta el límite según tus necesidades

/* Configuración para limitar peticiones de otros dominios
const whitelist = ['https://app-banarica.vercel.app'];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}
app.use(cors(corsOptions)); */
app.use(cors()); // Acceso a todos los dominios

require('./utils/auth');

app.get("/", checkApiKey, (req, res) => {
  res.send("<h3>Hola, soy el servidor de la CI Banarica SA</h3>");
});

routerApi(app);

app.use(logErrors);
app.use(boomErrorHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log("My port " + port);
});
