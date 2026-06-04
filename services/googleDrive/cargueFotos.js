const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Validar que existe la variable de entorno
if (!process.env.GOOGLE_DRIVE_CREDENTIALS) {
    throw new Error('Falta GOOGLE_DRIVE_CREDENTIALS en .env');
}

// Parsear credenciales desde variable de entorno
let creds;
try {
    creds = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
    console.log('✅ Credenciales de Google Drive cargadas correctamente');
    console.log('📧 Cuenta de servicio:', creds.client_email);
    console.log('📁 Proyecto:', creds.project_id);
} catch (error) {
    throw new Error('Error al parsear GOOGLE_DRIVE_CREDENTIALS: ' + error.message);
}

// Configuración de la autenticación CORRECTA
const auth = new google.auth.GoogleAuth({
    credentials: creds,  // Usar 'credentials' no 'keyFile'
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

const SHARED_DRIVE_OPTIONS = {
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
};

const limpiarFotosTemporales = (arreglosFotos = []) => {
    for (const foto of arreglosFotos) {
        if (foto?.path && fs.existsSync(foto.path)) {
            try {
                fs.unlinkSync(foto.path);
            } catch (error) {
                console.warn('No se pudo eliminar archivo temporal:', foto.path, error.message);
            }
        }
    }
};

const normalizarTexto = (value) => (
    String(value || '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
);

const formatearFechaNombre = (fecha) => {
    const texto = String(fecha || '').trim();
    if (!texto) {
        return 'sin_fecha';
    }

    const date = new Date(texto);
    if (Number.isNaN(date.getTime())) {
        return normalizarTexto(texto) || 'sin_fecha';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
};

const normalizarErrorGoogleDrive = (error) => {
    const message = error?.message || '';

    if (message.includes('Service Accounts do not have storage quota')) {
        return new Error('La carpeta configurada debe estar dentro de una unidad compartida de Google Drive y la cuenta de servicio debe tener permiso de Administrador de contenido. Las cuentas de servicio no pueden subir archivos a Mi unidad por cuota propia.');
    }

    return error;
};

/**
 * Función principal para procesar el formulario y subir MÚLTIPLES fotos
 * @param {Object} datosFormulario - { semana: 'Semana 22', fecha: '2026-05-30', item: 'ABC-123', carpetaID: 'ID_DE_GOOGLE_DRIVE' }
 * @param {Array} arreglosFotos - Array de objetos de archivos recibidos (ej: req.files de multer)
 * @returns {Promise<Object>} - Resultado con enlaces de las fotos subidas
 */
async function cargarEvidenciaLogistica(datosFormulario, arreglosFotos) {
    const { semana, fecha, item, vehiculo, finca_destino, destino, carpetaID } = datosFormulario;

    // VALIDAR que carpetaID existe
    if (!carpetaID) {
        throw new Error('Falta carpetaID en datosFormulario');
    }

    // VALIDAR que hay fotos para subir
    if (!arreglosFotos || arreglosFotos.length === 0) {
        throw new Error('No hay fotos para subir');
    }

    const ID_CARPETA_PRINCIPAL = carpetaID;
    const nombreSubcarpeta = `${semana} - ${fecha} - ${item}`;
    const fechaNormalizada = formatearFechaNombre(fecha);
    const semanaNormalizada = normalizarTexto(semana) || 'sin_semana';
    const vehiculoNormalizado = normalizarTexto(vehiculo || item) || 'sin_vehiculo';
    const destinoNormalizado = normalizarTexto(finca_destino || destino) || 'sin_destino';

    console.log(`📁 Carpeta principal ID: ${ID_CARPETA_PRINCIPAL}`);
    console.log(`📂 Nombre de subcarpeta: ${nombreSubcarpeta}`);
    console.log(`📸 Cantidad de fotos a subir: ${arreglosFotos.length}`);

    try {
        // STEP A: Buscar si la subcarpeta ya existe
        let subcarpetaId = null;
        const queryBusqueda = `name='${nombreSubcarpeta}' and '${ID_CARPETA_PRINCIPAL}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

        const resultadoBusqueda = await drive.files.list({ 
            q: queryBusqueda, 
            fields: 'files(id)',
            ...SHARED_DRIVE_OPTIONS,
        });

        if (resultadoBusqueda.data.files.length > 0) {
            subcarpetaId = resultadoBusqueda.data.files[0].id;
            console.log(`✅ Subcarpeta existente encontrada: ${subcarpetaId}`);
        } else {
            // STEP B: Si NO existe, la creamos una sola vez en este envío
            console.log(`🆕 Creando nueva subcarpeta: ${nombreSubcarpeta}`);
            const metadatosCarpeta = {
                name: nombreSubcarpeta,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [ID_CARPETA_PRINCIPAL]
            };
            const nuevaCarpeta = await drive.files.create({ 
                resource: metadatosCarpeta, 
                fields: 'id',
                supportsAllDrives: true,
            });
            subcarpetaId = nuevaCarpeta.data.id;
            console.log(`✅ Subcarpeta creada con ID: ${subcarpetaId}`);
        }

        // STEP C: Recorrer y subir cada una de las fotos enviadas a esa misma subcarpeta
        const enlacesFotosSubidas = [];
        let contador = 1;

        for (const foto of arreglosFotos) {
            // 'foto.path' es la ruta temporal donde Multer guarda el archivo en tu servidor
            const rutaFotoLocal = foto.path;

            // Validar que el archivo existe
            if (!fs.existsSync(rutaFotoLocal)) {
                console.warn(`⚠️ Archivo no encontrado: ${rutaFotoLocal}`);
                continue;
            }

            // Generar nombre único para la foto
            const extensionOriginal = path.extname(foto.originalname || '').toLowerCase() || '.jpg';
            const numero = String(contador).padStart(2, '0');
            const identificadorUnico = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
            const nombreArchivo = `${fechaNormalizada}_${semanaNormalizada}__${vehiculoNormalizado}__${destinoNormalizado}__${identificadorUnico}${extensionOriginal}`;

            const metadatosArchivo = {
                name: nombreArchivo,
                parents: [subcarpetaId]
            };

            const media = {
                mimeType: foto.mimetype || 'image/jpeg',
                body: fs.createReadStream(rutaFotoLocal)
            };

            console.log(`📤 Subiendo foto ${contador} de ${arreglosFotos.length}: ${nombreArchivo}`);
            
            const archivoSubido = await drive.files.create({
                resource: metadatosArchivo,
                media: media,
                fields: 'id, webViewLink',
                supportsAllDrives: true,
            });

            // Guardamos el link de cada foto en nuestro arreglo de resultados
            enlacesFotosSubidas.push({
                idDrive: archivoSubido.data.id,
                urlDrive: archivoSubido.data.webViewLink,
                nombreOriginal: foto.originalname,
                nombreDrive: nombreArchivo
            });

            // Eliminar la foto temporal de tu servidor local para no llenar tu disco
            try {
                if (fs.existsSync(rutaFotoLocal)) {
                    fs.unlinkSync(rutaFotoLocal);
                    console.log(`🗑️ Archivo temporal eliminado: ${rutaFotoLocal}`);
                }
            } catch (err) {
                console.warn(`⚠️ No se pudo eliminar archivo temporal: ${rutaFotoLocal}`, err.message);
            }

            contador++;
        }

        console.log(`✅ ¡Se subieron con éxito ${enlacesFotosSubidas.length} de ${arreglosFotos.length} fotos!`);
        
        return {
            exito: true,
            nombreCarpeta: nombreSubcarpeta,
            carpetaId: subcarpetaId,
            carpetaUrl: `https://drive.google.com/drive/folders/${subcarpetaId}`,
            totalFotos: enlacesFotosSubidas.length,
            fotos: enlacesFotosSubidas
        };

    } catch (error) {
        console.error('❌ Error en el proceso de carga múltiple a Google Drive:', error);
        limpiarFotosTemporales(arreglosFotos);
        throw normalizarErrorGoogleDrive(error);
    }
}

/**
 * Función para obtener el ID de una carpeta por nombre
 * @param {string} nombreCarpeta - Nombre de la carpeta a buscar
 * @param {string} carpetaPadreId - ID de la carpeta padre
 * @returns {Promise<string|null>} - ID de la carpeta o null si no existe
 */
async function obtenerCarpetaPorNombre(nombreCarpeta, carpetaPadreId) {
    try {
        const queryBusqueda = `name='${nombreCarpeta}' and '${carpetaPadreId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const resultado = await drive.files.list({ q: queryBusqueda, fields: 'files(id, name)', ...SHARED_DRIVE_OPTIONS });
        
        if (resultado.data.files.length > 0) {
            return resultado.data.files[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error al buscar carpeta:', error);
        throw error;
    }
}

/**
 * Función para eliminar una foto de Google Drive por ID
 * @param {string} fileId - ID del archivo a eliminar
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
async function eliminarFotoDeDrive(fileId) {
    try {
        await drive.files.delete({ fileId });
        console.log(`✅ Archivo ${fileId} eliminado de Google Drive`);
        return true;
    } catch (error) {
        console.error(`❌ Error al eliminar archivo ${fileId}:`, error);
        return false;
    }
}

module.exports = { 
    cargarEvidenciaLogistica,
    obtenerCarpetaPorNombre,
    eliminarFotoDeDrive
};
