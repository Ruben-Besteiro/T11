// src/app.js
import express from 'express';
import cors from 'cors';
import * as Sentry from "@sentry/node";
import dbConnect from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './api-docs/swagger.js';
import morgan from 'morgan';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleSlack.js';
import { env } from './config/env.js';

const app = express();

// Middleware globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Después de express.json(), antes de las rutas
// Logs de cuerpo de petición
morganBody(app, {
  noColors: true,
  skip: (req, res) => res.statusCode < 400, // Solo errores
  stream: loggerStream
});

// Archivos estáticos
app.use('/uploads', express.static('storage'));     // Cuando el usuario mete uploads en la URL, se mete en la carpeta storage del servidor

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 🎯 RUTA DE PRUEBA PARA SENTRY
app.get("/debug-sentry", (req, res) => {
  const error = new Error("¡Mi primer error en Sentry (forzado manual)!");
  Sentry.captureException(error);
  throw error;
});


// Después de los middlewares, antes de las rutas
// Esto sirve para ver la documentación de la API en http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rutas principales de la API
app.use('/api', routes);

// --- MANEJO DE ERRORES (Orden crítico) ---

// 1. Sentry Error Handler (debe ir después de las rutas y antes de otros error handlers)
Sentry.setupExpressErrorHandler(app);

// 2. Manejo de rutas no encontradas
app.use(notFound);

// 3. Manejo de errores genéricos (Mongoose, etc)
app.use(errorHandler);

// Iniciar servidor
const PORT = env.PORT;

const startServer = async () => {
  console.log('Intentando conectar a:', env.MONGO_URL);
  await dbConnect();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en http://0.0.0.0:${PORT} [${env.NODE_ENV}]`);
  });
};

startServer();

export default app;