const express = require("express");
const router = express.Router();


var lista = []
for (let i = 0; i < 20; i++) {
  lista.push({
    id: i,
    descripcion: "Producto "
  });
}
//Query params, para comportamientos como paginar, filtrar


router.get("/", (req, res) => {
  res.json(lista);
});

//Enpoint recibiendo varios parametro
// Ejemplo localhost:3000/productos/filter?limit=10&offset=12
router.get("/filter", (req, res) => {
  const { limit, offset } = req.query;
  res.json({limit:limit, offset:offset})
});


//Endpoint dinamicos recibiendo un parametro
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const result = lista.find( (item) => item.id == id)
  res.send(result);
});

module.exports = router;
