const express = require('express');
const app = express();
const port = 3000;

app.get("/", (req, res)=>{
res.send("Hola, soy el servidor de la CI Banarica SA")
})

app.listen(port, ()=>{
  console.log("My port " + port);
})
