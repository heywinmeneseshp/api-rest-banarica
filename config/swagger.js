'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

// Documentacion generada a partir de comentarios @swagger sobre las rutas
// (ver routes/**/*.router.js). No cubre TODOS los endpoints todavia — se fue
// anotando primero los modulos mas activos (programador, programacion de
// corte, seguridad, listado, configuracion, auth). Para agregar mas
// endpoints, solo hay que agregarles el mismo bloque de comentario @swagger
// encima de la ruta en su router — swagger-jsdoc los recoge automaticamente
// sin tocar este archivo.
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Bana Rica',
      version: '2.0.0',
      description:
        'Documentacion de la API de logistica/trazabilidad de Bana Rica. '
        + 'Cubre progresivamente los endpoints — los que todavia no tienen '
        + 'anotacion @swagger no apareceran aca, pero siguen funcionando igual.',
    },
    servers: [
      { url: '/api/v1', description: 'Servidor actual' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Todos los routers, para que cualquier @swagger que se agregue despues
  // se recoja solo sin tener que tocar esta lista.
  apis: [
    './routes/**/*.router.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec, swaggerUiEnabled: env.nodeEnv !== 'production' || env.swaggerEnabled };
