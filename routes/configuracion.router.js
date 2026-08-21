const express = require('express');
const passport = require('passport');
const multer = require('multer');

const ConfigService = require('./../services/configuracion.service');
const service = new ConfigService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.id_rol !== 'Super administrador') {
    return res.status(403).json({ message: 'Solo un Super administrador puede exportar o importar la base de datos.' });
  }
  next();
};

const router = express.Router();

// Endpoints usados por el modal de configuracion del frontend.

router.get('/listar',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { prefix = '' } = req.query;
      const result = await service.list(prefix);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });


router.get('/encontrar/:modulo',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { modulo } = req.params;
      const result = await service.find(modulo, {
        syncWeeks: req.query.syncWeeks !== 'false',
      })
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

router.patch('/actualizar',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const body = req.body;
      const result = await service.update(body)
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

router.get('/email',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const result = await service.findEmailConfig()
      res.json([result]);
    } catch (err) {
      next(err);
    }
  });

router.patch('/email',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const body = req.body;
      const result = await service.updateEmailConfig(body)
      res.json(result);
    } catch (err) {
      next(err);
    }
  });


// Exportar toda la base de datos como un archivo .sql descargable.
router.get('/exportar-db',
  passport.authenticate('jwt', { session: false }),
  requireSuperAdmin,
  async (req, res, next) => {
    try {
      const sql = await service.exportarBaseDatosSql();
      const fecha = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      res.setHeader('Content-Disposition', `attachment; filename="backup-banarica-${fecha}.sql"`);
      res.setHeader('Content-Type', 'application/sql; charset=utf-8');
      res.send(sql);
    } catch (err) {
      next(err);
    }
  });

// Restaurar la base de datos desde un archivo .sql generado por /exportar-db
// (o cualquier dump compatible con INSERT/DELETE estandar).
// DESTRUCTIVO: ejecuta el archivo tal cual, sentencia por sentencia.
router.post('/importar-db',
  passport.authenticate('jwt', { session: false }),
  requireSuperAdmin,
  upload.single('archivo'),
  async (req, res, next) => {
    try {
      if (req.body?.confirmacion !== 'IMPORTAR BASE DE DATOS') {
        return res.status(400).json({ message: 'Falta la confirmacion exacta para importar la base de datos.' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'No se recibio ningun archivo.' });
      }

      const sqlTexto = req.file.buffer.toString('utf-8');
      const result = await service.importarBaseDatosSql(sqlTexto);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

module.exports = router;
