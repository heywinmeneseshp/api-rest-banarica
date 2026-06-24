const express = require('express');
const RegistroTemperaturaService = require('../../services/logistica/registroTemperatura.service.js');
const validatorHandler = require('../../middlewares/validator.handler');
const {
  crearRegistroTemperatura,
  actualizarRegistroTemperatura,
  getRegistroTemperatura
} = require('../../schema/registroTemperatura.schema');

const router = express.Router();
const service = new RegistroTemperaturaService();
router.get('/', async (req, res, next) => {
  try {
    const registros = await service.find();
    res.json(registros);
  } catch (error) {
    next(error);
  }
});

router.post('/cargar-masivo', async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.bulkCreate(body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/actualizar-masivo', async (req, res, next) => {
  try {
    const body = req.body;
    const result = await service.bulkUpdate(body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/paginar', async (req, res, next) => {
  try {
    const { offset, limit } = req.query;
    const body = req.body;
    const items = await service.paginate(offset, limit, body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/resumen', async (req, res, next) => {
  try {
    const { offset, limit } = req.query;
    const body = req.body;
    const items = await service.paginarResumen(offset, limit, body);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/grafica/:idSerial', async (req, res, next) => {
  try {
    const { idSerial } = req.params;
    const lecturas = await service.getLecturas(idSerial);
    res.json(lecturas);
  } catch (error) {
    next(error);
  }
});

router.get('/contexto/:idSerial', async (req, res, next) => {
  try {
    const { idSerial } = req.params;
    const contexto = await service.getContextoSerial(idSerial);
    res.json(contexto);
  } catch (error) {
    next(error);
  }
});

router.get('/:id',
  validatorHandler(getRegistroTemperatura, 'params'),
  async (req, res, next) => {
    const { id } = req.params;
    try {
      const registro = await service.findOne(id);
      res.json(registro);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/',
  validatorHandler(crearRegistroTemperatura, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const registroNuevo = await service.create(body);
      res.json({
        message: 'Registro de temperatura creado',
        data: registroNuevo
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch('/:id',
  validatorHandler(getRegistroTemperatura, 'params'),
  validatorHandler(actualizarRegistroTemperatura, 'body'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const registro = await service.update(id, body);
      res.json(registro);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id',
  validatorHandler(getRegistroTemperatura, 'params'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await service.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
