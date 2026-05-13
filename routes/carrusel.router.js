const express = require('express');
const db = require('../models');

const router = express.Router();

router.get('/por-transportadora/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const items = await db.carrusel.findAll({
      where: { id_transportadora: id },
      include: [{ model: db.Contenedor, as: 'contenedor' }]
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/por-contenedor/:contenedorId', async (req, res, next) => {
  try {
    const { contenedorId } = req.params;
    const item = await db.carrusel.findOne({
      where: { id_contenedor: contenedorId },
      include: [{ model: db.transportadoras, as: 'transportadora' }]
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
