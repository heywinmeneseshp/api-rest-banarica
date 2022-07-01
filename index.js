const express = require("express");
const routerApi = require('./routes')

const app = express();
const port = 3000;

app.use(express.json())

app.get("/", (req, res) => {
  res.send("Hola, soy el servidor de la CI Banarica SA");
});

routerApi(app);


app.listen(port, () => {
  console.log("My port " + port);
});
