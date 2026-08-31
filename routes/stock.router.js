const express = require("express");

const StockService = require('../services/stock.service');
const validatorHandler = require('../middlewares/validator.handler');
const { crearProductoEnAlmacen, addAndSubtract, habilitarDeshabilitar, noDispoble } = require('../schema/stock.schema');



const router = express.Router();
const service = new StockService();


//Crear
/**
 * @swagger
 * /stock:
 *   post:
 *     summary: Crea un registro
 *     tags: [Stock]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /stock/paginar:
 *   post:
 *     summary: Pagina y filtra registros
 *     tags: [Stock]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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

/**
 * @swagger
 * /stock:
 *   get:
 *     summary: Lista todos los registros
 *     tags: [Stock]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res, next) => {
  try {
    const items = await service.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /stock/export:
 *   post:
 *     summary: POST /export
 *     tags: [Stock]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/export", async (req, res, next) => {
  try {
    const body = req.body;
    const document = await service.exportCombo(body)
    res.json(document)
  } catch (e) {
    next(e)
  }
})

/**
 * @swagger
 * /stock/filter/{cons_almacen}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Stock]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: cons_almacen
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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

/**
 * @swagger
 * /stock/filter:
 *   post:
 *     summary: POST /filter
 *     tags: [Stock]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.post("/filter", async (req, res, next) => {
  try {
    const body = req.body;
    const item = await service.generalFilter(body);
    res.json(item);
  } catch (error) {
    next(error);
  }
})

/**
 * @swagger
 * /stock/filter/product/{cons_producto}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Stock]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: cons_producto
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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

/**
 * @swagger
 * /stock/filter/{cons_almacen}/{cons_producto}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Stock]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: cons_almacen
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cons_producto
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /stock/habilitar/{cons_almacen}/{cons_producto}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Stock]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: cons_almacen
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cons_producto
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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


  /**
   * @swagger
   * /stock/actualizar/{cons_almacen}/{cons_producto}:
   *   post:
   *     summary: POST /actualizar/:cons_almacen/:cons_producto
   *     tags: [Stock]
   *     security: []
   *     parameters:
   *       - in: path
   *         name: cons_almacen
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: cons_producto
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { type: object }
   *     responses:
   *       200: { description: OK }
   */
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

/**
 * @swagger
 * /stock/actualizar/{cons_almacen}/{cons_producto}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Stock]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: cons_almacen
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cons_producto
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
router.patch("/actualizar/:cons_almacen/:cons_producto",
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

/**
 * @swagger
 * /stock/sumar/{cons_almacen}/{cons_producto}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Stock]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: cons_almacen
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cons_producto
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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

/**
 * @swagger
 * /stock/restar/{cons_almacen}/{cons_producto}:
 *   patch:
 *     summary: Actualiza un registro
 *     tags: [Stock]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: cons_almacen
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cons_producto
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 */
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

  /**
   * @swagger
   * /stock/disponible/{cons_almacen}/{cons_producto}:
   *   patch:
   *     summary: Actualiza un registro
   *     tags: [Stock]
   *     security: []
   *     parameters:
   *       - in: path
   *         name: cons_almacen
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: cons_producto
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { type: object }
   *     responses:
   *       200: { description: OK }
   */
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

/**
 * @swagger
 * /stock/{id}:
 *   get:
 *     summary: Trae un registro por id
 *     tags: [Stock]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
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
/**
 * @swagger
 * /stock/{cons_almacen}/{cons_producto}:
 *   delete:
 *     summary: Elimina un registro
 *     tags: [Stock]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: cons_almacen
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cons_producto
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.delete("/:cons_almacen/:cons_producto", async (req, res, next) => {
  const { cons_almacen, cons_producto } = req.params
  try {
    const result = await service.deleteStock(cons_almacen, cons_producto)
    res.json(result)
  } catch (error) {
    next(error);
  }
});

module.exports = router;
