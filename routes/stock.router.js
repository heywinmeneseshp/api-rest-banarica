const express = require("express");

const StockService = require('../services/stock.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearProductoEnAlmacen, addAndSubtract, habilitarDeshabilitar, noDispoble } = require('../schema/stock.schema');



const router = express.Router();
const service = new StockService();


//Crear
router.post("/",
  validatorHandler(crearProductoEnAlmacen, "body"),
  async (req, res, next) => {
    try {
      const body = req.body;
      const itemNuevo = await service.create(body);
      res.json({
        message: "item creado",
        data: itemNuevo
      })
    } catch (error) {
      next(error);
    }
  });

// Ejemplo http://localhost:3000/api/v1/usuarios/paginar?page=1&limit=4
//Paginar
router.post("/paginar", async (req, res, next) => {
  try {
    const { almacenes } = req.body;
    const { page, limit } = req.query;
    const items = await service.paginate(page, limit, almacenes);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/export", async (req, res, next) => {
  try {
    const body = req.body;
    const document = await service.exportCombo(body)
    res.json(document)
  } catch (e) {
    next(e)
  }
})

router.get("/filter/:cons_almacen", async (req, res, next) => {
  try {
    const { cons_almacen } = req.params;
    const item = await service.findOneAlmacen(cons_almacen);
    res.json(item);
  } catch (error) {
    next(error);
  }
}
)

router.post("/filter", async (req, res, next) => {
  try {
    const body = req.body;
    const item = await service.generalFilter(body);
    res.json(item);
  } catch (error) {
    next(error);
  }
})

router.get("/filter/product/:cons_producto", async (req, res, next) => {
  try {
    const { cons_producto } = req.params;
    const item = await service.findOneProductInAll(cons_producto);
    res.json(item);
  } catch (error) {
    next(error);
  }
}
)

//findOneProductInAll

router.get("/filter/:cons_almacen/:cons_producto", async (req, res, next) => {
  try {
    const { cons_almacen, cons_producto } = req.params;
    const item = await service.filter(cons_almacen, cons_producto);
    res.json(item);
  } catch (error) {
    next(error);
  }
})

//ACTUALIZACIONES PARCIALES
router.patch("/habilitar/:cons_almacen/:cons_producto",
  validatorHandler(habilitarDeshabilitar, "body"),
  async (req, res, next) => {
    try {
      const { cons_almacen, cons_producto } = req.params
      const changes = req.body;
      const item = await service.update(cons_almacen, cons_producto, changes)
      res.json({
        message: 'El item fue actualizado',
        data: item
      })
    } catch (error) {
      next(error);
    }
  });


  router.post("/actualizar/:cons_almacen/:cons_producto",
  async (req, res, next) => {
    try {
      const { cons_almacen, cons_producto } = req.params
      const changes = req.body;
      const item = await service.update(cons_almacen, cons_producto, changes)
      res.json({
        message: 'El item fue actualizado',
        data: item
      })
    } catch (error) {
      next(error);
    }
  });

router.patch("/sumar/:cons_almacen/:cons_producto",
  validatorHandler(addAndSubtract, "body"),
  async (req, res, next) => {
    try {
      const { cons_almacen, cons_producto } = req.params
      const changes = req.body;
      console.log(cons_almacen, cons_producto, changes)
      const item = await service.addAmounts(cons_almacen, cons_producto, changes)
      res.json({
        message: 'El item fue actualizado',
        data: item
      })
    } catch (error) {
      next(error);
    }
  });

router.patch("/restar/:cons_almacen/:cons_producto",
  validatorHandler(addAndSubtract, "body"),
  async (req, res, next) => {
    try {
      const { cons_almacen, cons_producto } = req.params
      const changes = req.body;
      const item = await service.subtractAmounts(cons_almacen, cons_producto, changes)
      res.json({
        message: 'El item fue actualizado',
        data: item
      })
    } catch (error) {
      next(error);
    }
  });

  router.patch("/disponible/:cons_almacen/:cons_producto",
  validatorHandler(noDispoble, "body"),
  async (req, res, next) => {
    try {
      const { cons_almacen, cons_producto } = req.params
      const changes = req.body;
      const item = await service.update(cons_almacen, cons_producto, changes)
      res.json({
        message: 'El item fue actualizado',
        data: item
      })
    } catch (error) {
      next(error);
    }
  });

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const item = await service.findOne(id);
    res.json(item);
  } catch (error) {
    next(error)
  }
});

//ELIMINAR
router.delete("/:cons_almacen/:cons_producto", async (req, res, next) => {
  const { cons_almacen, cons_producto } = req.params
  try {
    const result = await service.delete(cons_almacen, cons_producto)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

module.exports = router;
