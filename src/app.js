// src/app.js
import express from 'express';
import cors from 'cors';
import * as Sentry from "@sentry/node";
import dbConnect from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './api-docs/swagger.js';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleSlack.js';
import { env } from './config/env.js';

const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARES ---

// 1. Parseo de Body (Siempre lo primero para evitar req.body undefined)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CORS
app.use(cors());

// 3. Logs de peticiones (Solo fuera de tests para evitar ruidos y problemas de stream)
if (process.env.NODE_ENV !== 'test') {
  morganBody(app, {
    noColors: true,
    skip: (req, res) => res.statusCode < 400,
    stream: loggerStream
  });
}

// 4. Archivos estáticos
app.use('/uploads', express.static('storage'));

// --- RUTAS ---

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ruta de prueba Sentry (Solo fuera de tests)
if (process.env.NODE_ENV !== 'test') {
  app.get("/debug-sentry", (req, res) => {
    const error = new Error("¡Mi primer error en Sentry (forzado manual)!");
    Sentry.captureException(error);
    throw error;
  });
}

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// API Routes
app.use('/api', routes);

// --- MANEJO DE ERRORES ---

// 1. Sentry Error Handler (Solo fuera de tests)
if (process.env.NODE_ENV !== 'test') {
  Sentry.setupExpressErrorHandler(app);
}

// 2. Manejo de rutas no encontradas
app.use(notFound);

// 3. Manejo de errores genéricos (Mongoose, etc)
app.use(errorHandler);

// --- ARRANQUE DEL SERVIDOR ---

const startServer = async () => {
  try {
    console.log('Intentando conectar a DB:', env.MONGO_URL);
    await dbConnect();
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor en http://0.0.0.0:${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('❌ Fallo al arrancar el servidor:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;