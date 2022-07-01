const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hola, soy el servidor de la CI Banarica SA");
});

//ADMINISTRADOR
app.get("/usuarios", (req, res) => {
  res.json();
});
app.get("/productos", (req, res) => {
  res.json();
});
app.get("/combos", (req, res) => {
  res.json();
});
app.get("/categorias", (req, res) => {
  res.json();
});
app.get("/proveedores", (req, res) => {
  res.json();
});
app.get("/bodegas", (req, res) => {
  res.json();
});
app.get("/transportadoras", (req, res) => {
  res.json();
});
app.get("/conductores", (req, res) => {
  res.json();
});
app.get("/notificaciones", (req, res) => {
  res.json();
});
app.get("/avisos", (req, res) => {
  res.json();
});

//Endpoint dinamicos recibiendo un parametro
app.get("/productos/:id", (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    nombre: "Tapa OT Kraf 18KG",
    cantidad: 452
  });
});
//Endpoint dinamicos recibiendo dos parametro
app.get("/categorias/:categoryId/productos/:productId", (req, res) => {
  const { categoryId, productId } = req.params;
  res.json({
    categoryId,
    productId
  });
});
//Query params, para comportamientos como paginar, filtrar
// Ejemplo localhost:3000/users?limit=10&offset=12
app.get("/users", (req, res) => {
  const { limit, offset } = req.query;
  if (limit && offset) {
    res.json({
      limit,
      offset
    });
  } else {
    res.send("No hay parametros");
  }
});

//ALMACEN
app.get("/recepcion", (req, res) => {
  res.json();
});
app.get("/pedidos", (req, res) => {
  res.json();
});
app.get("/traslados", (req, res) => {
  res.json();
});
app.get("/movimientos", (req, res) => {
  res.json();
});
//INFORMES
app.get("/historial-movimientos", (req, res) => {
  res.json();
});
app.get("/deudas", (req, res) => {
  res.json();
});

app.listen(port, () => {
  console.log("My port " + port);
});
