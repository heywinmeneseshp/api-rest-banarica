const express = require("express");
const cors = require('cors');
const routerApi = require('./routes');

//Middlewares error
const { logErrors, errorHandler, boomErrorHandler } = require('./middlewares/error.handler')

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
/* Configuracion para limitar pediciones de otros dominios
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
app.use(cors()); //Acceso a todos los dominios

app.get("/", (req, res) => {
  res.send("Hola, soy el servidor de la CI Banarica SA");
});

routerApi(app);

app.use(logErrors);
app.use(boomErrorHandler)
app.use(errorHandler);



app.listen(port, () => {
  console.log("My port " + port);
});
