const express = require("express");
const router = express.Router();

const { faker } = require("@faker-js/faker");

var productos = []
for (let i = 0; i < 20; i++) {
  productos.push({
    id: i,
    name: faker.commerce.productName(),
    id_categoria: faker.commerce.department(),
    id_proveedor: faker.company.companyName(),
    salida_sin_stock: faker.datatype.boolean(),
    serial: faker.datatype.boolean(),
    traslado: faker.datatype.boolean(),
    costo: parseInt(faker.commerce.price(), 10),
    habilitado: faker.datatype.boolean()
  });
}
//Query params, para comportamientos como paginar, filtrar


router.get("/", (req, res) => {
  res.json(productos);
});

//Enpoint recibiendo varios parametro
// Ejemplo localhost:3000/productos/filter?limit=10&offset=12
router.get("/filter", (req, res) => {
  const { limit, offset } = req.query;
  res.json({ limit: limit, offset: offset })
});


//Endpoint dinamicos recibiendo un parametro
router.get("/:id", (req, res) => {
  const { id } = req.params;
  if (id == 999) {
    res.status(404).json({
      message: "Artículo no encontrado"
    })
  } else {
    res.status(200).json({
      id,
      nombre: "Tapa OT Kraf 18KG",
      cantidad: 452
    });
  }
});

//Crear
router.post("/", (req, res) => {
  const body = req.body;
  productos.push(body)
  res.status(201).json({
    message: 'creado',
    data: body
  })
});

//ACTUALIZACIONES PARCIALES
router.patch("/:id", (req, res) => {
  const { id } = req.params
  const body = req.body;
  res.json({
    message: 'actualizado',
    data: body,
    id
  })
});

//ACTUALIZACIONES TOTALES
router.put("/:id", (req, res) => {
  const { id } = req.params
  const body = req.body;
  res.json({
    message: 'actualizado',
    data: body,
    id
  })
});

//ELIMINAR
router.put("/:id", (req, res) => {
  const { id } = req.params
  res.json({
    message: 'eliminado',
    id,
  })
});

module.exports = router;
