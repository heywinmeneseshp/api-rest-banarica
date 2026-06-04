const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { cargarEvidenciaLogistica } = require('../../services/googleDrive/cargueFotos');
const db = require('../../models');

const router = express.Router();
const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    }

    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)'));
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
});

const guardarEstadoEvidencia = async (programacionId, resultado) => {
    if (!programacionId) {
        return;
    }

    await db.programacion.update({
        evidencia_cargada: true,
        evidencia_carpeta_id: resultado.carpetaId || null,
        evidencia_carpeta_url: resultado.carpetaUrl || null,
        evidencia_fecha: new Date(),
        evidencia_total_fotos: resultado.totalFotos || 0,
    }, { where: { id: programacionId } });
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
        const { semana, fecha, item, carpetaID, programacion_id } = req.body;
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

        await guardarEstadoEvidencia(programacion_id, resultado);

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
        const { semana, fecha, item, carpetaID, programacion_id } = req.body;
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

        await guardarEstadoEvidencia(programacion_id, resultado);

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
