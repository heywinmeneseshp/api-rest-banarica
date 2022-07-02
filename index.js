const express = require("express");
const routerApi = require('./routes');

//Middlewares error
const { logErrors, errorHandler, boomErrorHandler  } = require('./middlewares/error.handler')

const app = express();
const port = 3000;

app.use(express.json())

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
