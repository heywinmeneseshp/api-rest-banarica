const express = require("express");
const multer = require("multer");
const path = require("path");
const { cargarEvidenciaLogistica, listarFotosDeCarpeta, obtenerContenidoArchivo } = require('../../services/googleDrive/cargueFotos');
const db = require('../../models');

const router = express.Router();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    }

    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)'));
};

// memoryStorage evita escribir al disco (requerido en entornos serverless como Vercel)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
});

const guardarEstadoEvidencia = async (programacionId, listadoId, resultado, trasladoId) => {
    const detalles = {
        evidencia_cargada: true,
        evidencia_carpeta_id: resultado.carpetaId || null,
        evidencia_carpeta_url: resultado.carpetaUrl || null,
        evidencia_fecha: new Date(),
        evidencia_total_fotos: resultado.totalFotos || 0,
    };

    if (programacionId) {
        await db.programacion.update(detalles, { where: { id: programacionId } });
    }

    if (listadoId) {
        await db.Listado.update(detalles, { where: { id: listadoId } });
    }

    if (trasladoId) {
        await db.traslados.update(detalles, { where: { id: trasladoId } });
    }
};

const validarSolicitud = (req, res, archivos) => {
    const { semana, fecha, item, carpetaID } = req.body;

    if (!semana || !fecha || !item) {
        res.status(400).json({
            success: false,
            error: 'Faltan campos requeridos: semana, fecha, item'
        });
        return false;
    }

    if (!archivos || archivos.length === 0) {
        res.status(400).json({
            success: false,
            error: 'No se enviaron archivos para subir'
        });
        return false;
    }

    if (!carpetaID) {
        res.status(400).json({
            success: false,
            error: 'Falta el ID de la carpeta principal de Google Drive'
        });
        return false;
    }

    return true;
};

router.post('/subir-evidencias', upload.array('fotos', 20), async (req, res, next) => {
    try {
        const { semana, fecha, item, carpetaID, programacion_id, listado_id, traslado_id } = req.body;
        const archivos = req.files;

        if (!validarSolicitud(req, res, archivos)) {
            return;
        }

        const resultado = await cargarEvidenciaLogistica({
            semana,
            fecha,
            item,
            vehiculo: req.body.vehiculo,
            finca_destino: req.body.finca_destino,
            carpetaID
        }, archivos);

        await guardarEstadoEvidencia(programacion_id, listado_id, resultado, traslado_id);

        res.json({
            success: true,
            message: 'Evidencias subidas exitosamente',
            data: resultado
        });
    } catch (error) {
        console.error('Error al subir evidencias:', error);
        next(error);
    }
});

router.post('/subir-evidencia', upload.single('foto'), async (req, res, next) => {
    try {
        const { semana, fecha, item, carpetaID, programacion_id, listado_id, traslado_id } = req.body;
        const archivos = req.file ? [req.file] : [];

        if (!validarSolicitud(req, res, archivos)) {
            return;
        }

        const resultado = await cargarEvidenciaLogistica({
            semana,
            fecha,
            item,
            vehiculo: req.body.vehiculo,
            finca_destino: req.body.finca_destino,
            carpetaID
        }, archivos);

        await guardarEstadoEvidencia(programacion_id, listado_id, resultado, traslado_id);

        res.json({
            success: true,
            message: 'Evidencia subida exitosamente',
            data: resultado
        });
    } catch (error) {
        console.error('Error al subir evidencia:', error);
        next(error);
    }
});

router.get('/listar-evidencias/:carpetaId', async (req, res, next) => {
    try {
        const { carpetaId } = req.params;

        if (!carpetaId) {
            return res.status(400).json({ success: false, error: 'Falta el ID de la carpeta' });
        }

        const fotos = await listarFotosDeCarpeta(carpetaId);

        res.json({ success: true, data: fotos });
    } catch (error) {
        next(error);
    }
});

router.get('/imagen/:fileId', async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const respuestaDrive = await obtenerContenidoArchivo(fileId);

        res.setHeader('Content-Type', respuestaDrive.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'private, max-age=3600');

        respuestaDrive.data
            .on('error', (error) => next(error))
            .pipe(res);
    } catch (error) {
        next(error);
    }
});

router.get('/test-drive', async (req, res, next) => {
    try {
        res.json({
            success: true,
            message: 'Servicio de Google Drive configurado correctamente',
            credenciales: process.env.GOOGLE_DRIVE_CREDENTIALS ? 'Configurado' : 'No configurado'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
