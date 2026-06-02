const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { cargarEvidenciaLogistica } = require('../../services/googleDrive/cargueFotos');

const router = express.Router();
const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para subir múltiples archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Carpeta temporal para guardar los archivos
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtrar solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)'));
    }
};

// Configurar Multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB por archivo
    },
    fileFilter: fileFilter
});

// Ruta para subir múltiples evidencias
router.post("/subir-evidencias",
    upload.array('fotos', 20), // Máximo 20 fotos, campo llamado 'fotos'
    async (req, res, next) => {
        try {
            const { semana, fecha, item, carpetaID } = req.body;
            const archivos = req.files;

            // Validaciones
            if (!semana || !fecha || !item) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan campos requeridos: semana, fecha, item'
                });
            }

            if (!archivos || archivos.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se enviaron archivos para subir'
                });
            }

            if (!carpetaID) {
                return res.status(400).json({
                    success: false,
                    error: 'Falta el ID de la carpeta principal de Google Drive'
                });
            }

            const resultado = await cargarEvidenciaLogistica({
                semana,
                fecha,
                item,
                carpetaID
            }, archivos);

            res.json({
                success: true,
                message: 'Evidencias subidas exitosamente',
                data: resultado
            });

        } catch (error) {
            console.error('Error al subir evidencias:', error);
            next(error);
        }
    }
);

// Ruta para subir una sola evidencia
router.post("/subir-evidencia",
    upload.single('foto'),
    async (req, res, next) => {
        try {
            const { semana, fecha, item, carpetaID } = req.body;
            const archivos = req.file ? [req.file] : [];

            // Validaciones
            if (!semana || !fecha || !item) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan campos requeridos: semana, fecha, item'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No se envió ningún archivo'
                });
            }

            if (!carpetaID) {
                return res.status(400).json({
                    success: false,
                    error: 'Falta el ID de la carpeta principal de Google Drive'
                });
            }

            const resultado = await cargarEvidenciaLogistica({
                semana,
                fecha,
                item,
                carpetaID
            }, archivos);

            res.json({
                success: true,
                message: 'Evidencia subida exitosamente',
                data: resultado
            });

        } catch (error) {
            console.error('Error al subir evidencia:', error);
            next(error);
        }
    }
);

// Ruta para probar la conexión con Google Drive
router.get("/test-drive", async (req, res, next) => {
    try {
        res.json({
            success: true,
            message: 'Servicio de Google Drive configurado correctamente',
            credenciales: process.env.GOOGLE_DRIVE_CREDENTIALS ? '✅ Configurado' : '❌ No configurado'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;